import { Prisma, PrismaClient, Task } from '../../../generated/prisma/client'
import { TaskSearchParams } from './task.schema'

interface ITaskRepository {
  search(query: TaskSearchParams): Promise<Task[]>
}

export class TaskRepository implements ITaskRepository {
  private readonly prisma: PrismaClient
  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma
  }

  async search(query: TaskSearchParams): Promise<Task[]> {
    const endExclusive = new Date(query.windowEndTime)
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)
    endExclusive.setUTCHours(0, 0, 0, 0)
    const where: Prisma.TaskWhereInput = {
      deleted: false,
      scheduleStartTime: { lte: endExclusive },
      scheduleEndTime: { gte: query.windowStartTime },
    }
    return this.prisma.task.findMany({
      where,
    })
  }
}

export default TaskRepository
