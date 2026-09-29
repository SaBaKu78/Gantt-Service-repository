import assert from 'node:assert/strict'
import { GanttService } from '../src/modules/gantt/gantt.service'
import type {
  GanttAssignment,
  GanttResource,
  GanttShift,
  GanttTask,
  IGanttRepository,
} from '../src/modules/gantt/gantt.port'
import type { IUnitOfWork } from '../src/shared/application/unit-of-work.port'
import type { IGanttRepositoryFactory } from '../src/modules/gantt/gantt.port'

const windowStart = new Date('2026-09-18T03:00:00.000Z')
const windowEnd = new Date('2026-09-18T06:00:00.000Z')

function repository(): IGanttRepository {
  const resources: GanttResource[] = [
    { id: 1n, code: 'R1', name: 'Has shift', displayName: 'Has shift', resourceStatus: 'ON', displayOrder: 1 },
    { id: 2n, code: 'R2', name: 'No shift', displayName: 'No shift', resourceStatus: 'ON', displayOrder: 2 },
  ]
  const shifts: GanttShift[] = [
    { id: 11n, resourceId: 1n, startTime: new Date('2026-09-18T02:00:00.000Z'), endTime: new Date('2026-09-18T05:00:00.000Z'), dailyOnOff: 1 },
  ]
  const tasks: GanttTask[] = [
    { id: 101n, taskName: 'Assigned', taskTypeId: 1n, taskTypeName: 'Type', taskStatus: 1, locked: false, notifyStatus: 0, scheduleStartTime: new Date('2026-09-18T03:30:00.000Z'), scheduleEndTime: new Date('2026-09-18T04:00:00.000Z'), taskTime: new Date('2026-09-18T03:30:00.000Z'), flightId: 1n, flightNum: null, inFlightNum: null, outFlightNum: null, inBoundFlightStatus: null, outBoundFlightStatus: null, inBoundStandName: null, outBoundStandName: null, description: null },
    { id: 102n, taskName: 'Unassigned', taskTypeId: 1n, taskTypeName: 'Type', taskStatus: 1, locked: false, notifyStatus: 0, scheduleStartTime: new Date('2026-09-18T04:00:00.000Z'), scheduleEndTime: new Date('2026-09-18T04:30:00.000Z'), taskTime: new Date('2026-09-18T04:00:00.000Z'), flightId: 1n, flightNum: null, inFlightNum: null, outFlightNum: null, inBoundFlightStatus: null, outBoundFlightStatus: null, inBoundStandName: null, outBoundStandName: null, description: null },
  ]
  const assignments: GanttAssignment[] = [
    { id: 201n, taskId: 101n, resourceId: 1n, shiftId: 11n, status: 'ACCEPTED', version: 2, deleted: false, assignedAt: new Date('2026-09-18T02:00:00.000Z') },
  ]
  return {
    findResources: async () => resources,
    findShifts: async () => shifts,
    findTasks: async () => tasks,
    findActiveAssignments: async () => assignments,
  }
}

const unitOfWork: IUnitOfWork = {
  execute: async (work) => work({} as never),
}

const repositoryFactory: IGanttRepositoryFactory = {
  create: () => repository(),
}

const result = await new GanttService({ unitOfWork, ganttRepositoryFactory: repositoryFactory }).search({
  windowStartTime: windowStart,
  windowEndTime: windowEnd,
  resourceCategoryCode: 'STAF',
})

assert.deepEqual(result.rows.map((row) => row.resourceId), ['1'])
assert.deepEqual(result.rows[0].assignedTasks.map((task) => task.id), ['101'])
assert.deepEqual(result.unassignedTasks.map((task) => [task.id, task.reason]), [['102', 'NO_ACTIVE_ASSIGNMENT']])
assert.equal(result.statistics.resourceCount, 1)
assert.equal(result.statistics.assignedTaskCount, 1)
assert.equal(result.statistics.unassignedTaskCount, 1)

console.log('gantt service tests passed')
