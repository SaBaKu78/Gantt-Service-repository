import type { Prisma } from '../../../generated/prisma/client'
import type { IAssignmentRepository, IAssignmentRepositoryFactory } from './assignment.port'
import AssignmentRepository from './assignment.repository'

export class AssignmentRepositoryFactory implements IAssignmentRepositoryFactory {
  create(transaction: Prisma.TransactionClient): IAssignmentRepository {
    return new AssignmentRepository({ prisma: transaction })
  }
}

export default AssignmentRepositoryFactory
