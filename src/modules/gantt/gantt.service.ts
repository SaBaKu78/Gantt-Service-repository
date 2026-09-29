import {
  assertValidWindow,
  clipToWindow,
  isActiveAssignment,
  isCoveredByShift,
  Window,
} from './gantt.domain'
import type { IUnitOfWork } from '../../shared/application/unit-of-work.port'
import type { IGanttRepositoryFactory } from './gantt.port'
import { Prisma } from '../../../generated/prisma/client'
import { GanttAssign, GanttSearch } from './gantt.schema'
import {
  GanttAssignResult,
  GanttResourceRow,
  GanttSearchResult,
  GanttTaskBar,
  GanttUnassignedTask,
} from './gantt.type'

export class GanttService {
  private readonly unitOfWork: IUnitOfWork
  private readonly repositoryFactory: IGanttRepositoryFactory

  constructor({
    unitOfWork,
    ganttRepositoryFactory,
  }: {
    unitOfWork: IUnitOfWork
    ganttRepositoryFactory: IGanttRepositoryFactory
  }) {
    this.unitOfWork = unitOfWork
    this.repositoryFactory = ganttRepositoryFactory
  }

  async search(query: GanttSearch): Promise<GanttSearchResult> {
    const window: Window = {
      start: query.windowStartTime,
      end: query.windowEndTime,
    }
    assertValidWindow(window)
    const result = await this.unitOfWork.execute(async (transaction) => {
      const repository = this.repositoryFactory.create(transaction)
      const allResources = await repository.findResources(
        query.resourceCategoryCode,
      )
      const allResourceIds = allResources.map((r) => r.id)

      const shifts = await repository.findShifts(allResourceIds, window)

      const shiftsByResource = groupBy(shifts, (shift) =>
        String(shift.resourceId),
      )

      const resources = allResources.filter(
        (resource) => (shiftsByResource.get(String(resource.id)) ?? []).length > 0,
      )
      const resourceIds = new Set(resources.map((r) => String(r.id)))

      const tasks = await repository.findTasks(window)

      const taskIds = tasks.map((t) => t.id)

      const assignments = await repository.findActiveAssignments(taskIds)

      const assignmentByTasks = groupBy(assignments, (assignment) =>
        String(assignment.taskId),
      )

      const resourceRows = new Map<string, GanttResourceRow>()

      for (const resource of resources) {
        const currentStringResourceId = String(resource.id)
        const resourceShifts =
          shiftsByResource.get(currentStringResourceId) ?? []
        resourceRows.set(currentStringResourceId, {
          resourceId: currentStringResourceId,
          resourceCode: resource.code,
          resourceName: resource.name,
          resourceDisplayName: resource.displayName,
          resourceStatus: resource.resourceStatus,
          displayOrder: resource.displayOrder,
          availability: resourceShifts.map((shift) => {
            const clipped = clipToWindow(shift.startTime, shift.endTime, window)
            return {
              shiftId: String(shift.id),
              startTime: clipped.start.toISOString(),
              endTime: clipped.end.toISOString(),
              status: shift.dailyOnOff,
            }
          }),
          assignedTasks: [],
        })
      }

      const assignedTasks = new Set<string>()
      const unassignedTasks: GanttUnassignedTask[] = []

      for (const task of tasks) {
        const assignment = selectCurrentAssignment(
          assignmentByTasks.get(String(task.id)) ?? [],
        )
        const taskBar = toTaskBar(task, assignment)
        if (
          !assignment ||
          !isActiveAssignment(assignment.status, assignment.deleted)
        ) {
          unassignedTasks.push({
            ...taskBar,
            reason: 'NO_ACTIVE_ASSIGNMENT',
          })
          continue
        }

        const row = resourceRows.get(String(assignment.resourceId))

        if (!row || !resourceIds.has(String(assignment.resourceId))) {
          unassignedTasks.push({
            ...taskBar,
            reason: 'RESOURCE_NOT_IN_WINDOW',
          })
          continue
        }

        const taskShifts =
          shiftsByResource.get(String(assignment.resourceId)) ?? []

        const matchedShift = taskShifts.find((shift) => {
          return String(shift.id) === String(assignment.shiftId)
        })

        if (!matchedShift) {
          unassignedTasks.push({
            ...taskBar,
            reason: 'OUTSIDE_SHIFT',
          })
          continue
        }

        const covered = isCoveredByShift(
          task.scheduleStartTime,
          task.scheduleEndTime,
          matchedShift.startTime,
          matchedShift.endTime,
        )

        row.assignedTasks.push({
          ...taskBar,
          assignmentId: String(assignment.id),
          assignmentStatus: assignment.status,
          shiftId: String(assignment.shiftId),
          assignmentVersion: assignment.version,
          outsideShift: !covered,
        })

        assignedTasks.add(String(task.id))
      }

      return {
        window: {
          startTime: window.start.toISOString(),
          endTime: window.end.toISOString(),
        },
        rows: [...resourceRows.values()],
        unassignedTasks,
        statistics: {
          resourceCount: resourceRows.size,
          shiftCount: shifts.length,
          taskCount: tasks.length,
          assignedTaskCount: assignedTasks.size,
          unassignedTaskCount: unassignedTasks.length,
        },
      }
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    })
    return result
  }

}

function selectCurrentAssignment(assignments: any[]) {
  return (
    assignments
      .filter((assignment) =>
        isActiveAssignment(assignment.status, assignment.deleted),
      )
      .sort((a, b) => {
        return b.assignedAt.getTime() - a.assignedAt.getTime()
      })[0] ?? null
  )
}

function toTaskBar(task: any, assignment: any): GanttTaskBar {
  return {
    id: String(task.id),
    name: task.taskName ?? '',
    startTime: task.scheduleStartTime.toISOString(),
    endTime: task.scheduleEndTime.toISOString(),
    status: task.taskStatus,
    color: getTaskColor(task.taskStatus, assignment?.status),
    assignmentId: assignment ? String(assignment.id) : null,
    assignmentStatus: assignment?.status ?? null,
    shiftId: assignment ? String(assignment.shiftId) : null,
    assignmentVersion: assignment?.version ?? null,
    outsideShift: false,
  }
}

function getTaskColor(
  taskStatus: number | null,
  assignmentStatus?: string,
): string {
  if (assignmentStatus === 'CANCELLED') return '#9E9E9E'
  if (assignmentStatus === 'ACCEPTED') return '#4CAF50'
  if (assignmentStatus === 'WORKING') return '#2196F3'
  if (taskStatus === 4) return '#757575'
  return '#FFC107'
}

function groupBy<T>(
  values: T[],
  keySelector: (value: T) => string,
): Map<string, T[]> {
  const map = new Map<string, T[]>()

  for (const value of values) {
    const key = keySelector(value)
    let list = map.get(key)
    if (!list) {
      list = []
      map.set(key, list)
    }
    list.push(value)
  }

  return map
}

export default GanttService
