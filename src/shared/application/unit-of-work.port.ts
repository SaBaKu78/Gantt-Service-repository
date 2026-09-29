import type { Prisma } from '../../../generated/prisma/client'

/**
 * 通用数据库事务接口。
 * 事务边界由应用服务决定，具体事务实现由基础设施适配器提供。
 */
export interface IUnitOfWork {
  execute<T>(
    work: (transaction: Prisma.TransactionClient) => Promise<T>,
    options?: {
      isolationLevel?: Prisma.TransactionIsolationLevel
    },
  ): Promise<T>
}
