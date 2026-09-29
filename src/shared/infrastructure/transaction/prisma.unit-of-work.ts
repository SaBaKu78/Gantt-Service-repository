import { Prisma, PrismaClient } from '../../../../generated/prisma/client'
import type { IUnitOfWork } from '../../application/unit-of-work.port'

/** Prisma 事务适配器：只负责开启、提交和回滚事务。 */
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma
  }

  private readonly prisma: PrismaClient

  execute<T>(
    work: (transaction: Prisma.TransactionClient) => Promise<T>,
    options?: {
      isolationLevel?: Prisma.TransactionIsolationLevel
    },
  ): Promise<T> {
    return this.prisma.$transaction(async (transaction) => work(transaction), {
      isolationLevel:
        options?.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
    })
  }
}

export default PrismaUnitOfWork
