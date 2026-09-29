import type { Prisma } from '../../../generated/prisma/client'
import GanttRepository from './gantt.repository'
import type { IGanttRepository, IGanttRepositoryFactory } from './gantt.port'

export class GanttRepositoryFactory implements IGanttRepositoryFactory {
  create(transaction: Prisma.TransactionClient): IGanttRepository {
    return new GanttRepository({ prisma: transaction })
  }
}

export default GanttRepositoryFactory
