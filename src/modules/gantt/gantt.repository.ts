import { Prisma, PrismaClient } from '../../../generated/prisma/client'
import { Window } from './gantt.domain'
import {
  GanttAssignment,
  GanttResource,
  GanttShift,
  GanttTask,
  IGanttRepository,
} from './gantt.port'

type GanttDbClient = PrismaClient | Prisma.TransactionClient

export class GanttRepository implements IGanttRepository {
  private prisma: GanttDbClient

  constructor({ prisma }: { prisma: GanttDbClient }) {
    this.prisma = prisma
  }

  async findResources(categoryCode: string): Promise<GanttResource[]> {
    const where: Prisma.ResourceWhereInput = {
      resourceCategoryCode: categoryCode,
      displayed: true,
    }
    return this.prisma.resource.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        displayName: true,
        resourceStatus: true,
        displayOrder: true,
      },
      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    })
  }

  async findShifts(
    resourceIds: bigint[],
    window: Window,
  ): Promise<GanttShift[]> {
    const where: Prisma.ShiftDailyWhereInput = {
      resourceId: { in: resourceIds },
      dailyOnOff: 1,
      scheduleShiftStartTime: { lt: window.end },
      scheduleShiftEndTime: { gt: window.start },
    }
    const rows = await this.prisma.shiftDaily.findMany({
      where,
      select: {
        id: true,
        resourceId: true,
        scheduleShiftStartTime: true,
        scheduleShiftEndTime: true,
        dailyOnOff: true,
      },
      orderBy: {
        scheduleShiftStartTime: 'asc',
      },
    })
    return rows.map((r) => ({
      id: r.id,
      resourceId: r.resourceId,
      startTime: r.scheduleShiftStartTime,
      endTime: r.scheduleShiftEndTime,
      dailyOnOff: r.dailyOnOff,
    }))
  }

  async findTasks(window: Window): Promise<GanttTask[]> {
    const where: Prisma.TaskWhereInput = {
      deleted: false,
      scheduleStartTime: { lt: window.end },
      scheduleEndTime: { gt: window.start },
    }
    return this.prisma.task.findMany({
      where,
      select: {
        id: true,
        taskName: true,
        taskTypeId: true,
        taskTypeName: true,

        taskStatus: true,
        locked: true,
        notifyStatus: true,

        scheduleStartTime: true,
        scheduleEndTime: true,
        taskTime: true,

        flightId: true,
        flightNum: true,
        inFlightNum: true,
        outFlightNum: true,

        inBoundFlightStatus: true,
        outBoundFlightStatus: true,

        inBoundStandName: true,
        outBoundStandName: true,

        description: true,
      },

      orderBy: {
        scheduleStartTime: 'asc',
      },
    })
  }

  async findActiveAssignments(taskIds: bigint[]): Promise<GanttAssignment[]> {
    const where: Prisma.AssignmentWhereInput = {
      taskId: {
        in: taskIds,
      },
      status: {
        notIn: ['RELEASED', 'CANCELLED'],
      },
      deleted: false,
    }
    const rows = await this.prisma.assignment.findMany({
      where,
      select: {
        id: true,
        taskId: true,
        currentResourceId: true,
        currentShiftDailyId: true,
        status: true,
        version: true,
        deleted: true,
        assignedAt: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    })
    return rows.map((row) => ({
      id: row.id,
      taskId: row.taskId,
      resourceId: row.currentResourceId,
      shiftId: row.currentShiftDailyId,
      status: row.status,
      version: row.version,
      deleted: row.deleted,
      assignedAt: row.assignedAt,
    }))
  }
}

export default GanttRepository
