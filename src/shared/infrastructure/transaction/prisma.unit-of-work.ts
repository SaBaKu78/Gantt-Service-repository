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
    return this.executeWithRetry(work, options)
  }

  /**
   * InnoDB may abort one transaction when concurrent writers deadlock.
   * Retrying the complete transaction is safe because the callback is rerun
   * against a fresh transaction, rather than reusing a partially rolled-back
   * client.
   */
  private async executeWithRetry<T>(
    work: (transaction: Prisma.TransactionClient) => Promise<T>,
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): Promise<T> {
    const maxAttempts = 3

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => work(transaction),
          {
            isolationLevel:
              options?.isolationLevel ??
              Prisma.TransactionIsolationLevel.ReadCommitted,
          },
        )
      } catch (error) {
        if (!isRetryableTransactionError(error) || attempt === maxAttempts) {
          throw error
        }

        // Small exponential backoff reduces repeated contention without
        // holding any database lock between attempts.
        await sleep(25 * 2 ** (attempt - 1))
      }
    }

    throw new Error('Transaction retry loop exited unexpectedly')
  }
}

function isRetryableTransactionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  )
}

/** Non-blocking delay used between transaction retry attempts. */
function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export default PrismaUnitOfWork
