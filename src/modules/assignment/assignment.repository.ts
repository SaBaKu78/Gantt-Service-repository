import type { Prisma } from '../../../generated/prisma/client'
import type { AssignmentStatus } from './assignment.domain'
import { AssignmentDomainError } from './assignment.domain'
import type {
  AssignmentRecord,
  AssignmentResource,
  AssignmentShift,
  AssignmentTask,
  IAssignmentRepository,
  AppendEventInput,
} from './assignment.port'

export class AssignmentRepository implements IAssignmentRepository {
  constructor({ prisma }: { prisma: Prisma.TransactionClient }) {
    this.prisma = prisma
  }

  private readonly prisma: Prisma.TransactionClient

  async findTaskForUpdateById(taskId: bigint): Promise<AssignmentTask | null> {
    const rows = await this.prisma.$queryRaw<AssignmentTask[]>`
      SELECT id, taskTypeId, deleted, locked, scheduleStartTime,
             scheduleEndTime, currentAssignmentId
      FROM tasks
      WHERE id = ${taskId}
      FOR UPDATE
    `
    return rows[0] ?? null
  }

  async findResource(resourceId: bigint): Promise<AssignmentResource | null> {
    const row = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        code: true,
        name: true,
        displayName: true,
        relatedExternalId: true,
        resourceGroupId: true,
        resourceStatus: true,
        displayed: true,
      },
    })
    return row ? { ...row, resourceExternalId: row.relatedExternalId } : null
  }

  /**
   * Lock the resource row for the duration of the assignment transaction.
   * This serializes concurrent assignments targeting the same resource.
   */
  async findResourceForUpdateById(resourceId: bigint): Promise<AssignmentResource | null> {
    const rows = await this.prisma.$queryRaw<Array<{
      id: bigint
      code: string
      name: string
      displayName: string
      relatedExternalId: string
      resourceGroupId: bigint
      resourceStatus: string
      displayed: boolean
    }>>`
      SELECT id, code, name, displayName, relatedExternalId,
             resourceGroupId, resourceStatus, displayed
      FROM resources
      WHERE id = ${resourceId}
      FOR UPDATE
    `
    const row = rows[0]
    return row ? { ...row, resourceExternalId: row.relatedExternalId } : null
  }

  async findShift(shiftId: bigint): Promise<AssignmentShift | null> {
    const row = await this.prisma.shiftDaily.findUnique({
      where: { id: shiftId },
      select: {
        id: true,
        resourceId: true,
        dailyOnOff: true,
        scheduleShiftStartTime: true,
        scheduleShiftEndTime: true,
      },
    })
    return row
      ? {
          id: row.id,
          resourceId: row.resourceId,
          dailyOnOff: row.dailyOnOff,
          plannedStartTime: row.scheduleShiftStartTime,
          plannedEndTime: row.scheduleShiftEndTime,
        }
      : null
  }

  async findAssignmentById(id: bigint): Promise<AssignmentRecord | null> {
    const row = await this.prisma.assignment.findUnique({ where: { id } })
    return row ? this.map(row) : null
  }

  //判断资源是否存在派遣冲突
  async findResourceIsConflict(input: {
    resourceId: bigint,
    taskId?: bigint,
    startTime: Date,
    endTime: Date
  }): Promise<AssignmentRecord | null> {
    const where: Prisma.AssignmentWhereInput = {
      currentResourceId: input.resourceId,
      deleted: false,
      ...(input.taskId === undefined ? {} : { taskId: { not: input.taskId } }),
      status: {
        in: ['ASSIGNED', 'ACCEPTED', 'WORKING']
      },
      task: {
        deleted: false,
        scheduleStartTime: {
          lt: input.endTime
        },
        scheduleEndTime: {
          gt: input.startTime
        }
      }
    }
    const results = await this.prisma.assignment.findFirst({
      where
    })
    return results ? this.map(results) : null
  }

  /**
   * 将领域事件写入当前事务中的 Outbox 表。
   * 这里只负责持久化，不发送 WebSocket；事务提交后再由发布器处理。
   */
  async appendEvent(input: AppendEventInput): Promise<bigint> {
    // 使用 SQL 是为了兼容尚未重新生成 Prisma Client 的旧运行环境；
    // $executeRaw 仍然使用当前 TransactionClient，因此事件与业务写入同事务。
    await this.prisma.$executeRaw`
      INSERT INTO domain_events
        (eventType, aggregateType, aggregateId, payload, occurredAt, published, retryCount)
      VALUES
        (${input.eventType}, ${input.aggregateType}, ${input.aggregateId},
         ${JSON.stringify(serializeEventPayload(input.payload))}, ${input.occurredAt}, false, 0)
    `

    const rows = await this.prisma.$queryRaw<Array<{ id: bigint }>>`
      SELECT LAST_INSERT_ID() AS id
    `
    return rows[0].id
  }

  async create(input: {
    taskId: bigint
    resourceId: bigint
    shiftDailyId: bigint
    resource: AssignmentResource
    taskTypeId?: bigint
    way?: number
    assignedAt: Date
  }): Promise<AssignmentRecord> {
    const row = await this.prisma.assignment.create({
      data: {
        id: BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000)),
        taskId: input.taskId,
        taskTypeId: input.taskTypeId ?? 0n,
        way: input.way ?? 0,
        currentResourceId: input.resourceId,
        currentResourceCode: input.resource.code,
        currentResourceName: input.resource.name,
        currentResourceDisplayName: input.resource.displayName,
        currentResourceExternalId: input.resource.resourceExternalId,
        currentResourceGroupId: input.resource.resourceGroupId,
        currentRelatedResourceId: 0n,
        currentRelatedResourceName: '',
        currentRelatedResourceOther: '',
        currentRelatedResourceOther2: '',
        currentRelatedResourceOther3: '',
        currentRelatedResourceOther4: '',
        currentShiftDailyId: input.shiftDailyId,
        notifyStatus: 0,
        businessType: 0,
        departmentId: 0,
        organizationId: 0,
        updateUserId: 0,
        updateTime: input.assignedAt,
        createTime: input.assignedAt,
        createUserId: 0,
        deleted: false,
        status: 'ASSIGNED',
        version: 1,
        assignedAt: input.assignedAt,
      },
    })
    return this.map(row)
  }

  async transition(id: bigint, fromVersion: number, status: AssignmentStatus, at: Date): Promise<AssignmentRecord> {
    const result = await this.prisma.assignment.updateMany({
      where: { id, version: fromVersion, deleted: false },
      data: {
        status,
        version: { increment: 1 },
        updateTime: at,
        acceptedAt: status === 'ACCEPTED' ? at : undefined,
        releasedAt: ['RELEASED', 'CANCELLED'].includes(status) ? at : undefined,
      },
    })
    if (result.count !== 1) {
      throw new AssignmentDomainError('VERSION_CONFLICT', 'Assignment version conflict')
    }
    return this.map(await this.prisma.assignment.findUniqueOrThrow({ where: { id } }))
  }

  async setTaskCurrentAssignment(
    taskId: bigint,
    assignment: AssignmentRecord,
    resource: AssignmentResource,
    at: Date,
  ): Promise<void> {
    const result = await this.prisma.task.updateMany({
      where: { id: taskId, currentAssignmentId: null },
      data: {
        currentAssignmentId: assignment.id,
        currentAssignmentStatus: assignment.status,
        currentAssignmentVersion: assignment.version,
        currentShiftDailyId: assignment.shiftDailyId,
        currentResourceId: resource.id,
        currentResourceName: resource.name,
        currentResourceDisplayName: resource.displayName,
        taskAssignUpdateTime: at,
      },
    })
    if (result.count !== 1) {
      throw new AssignmentDomainError('TASK_ALREADY_ASSIGNED', 'Task assignment state changed')
    }
  }

  async updateTaskAfterTransition(
    taskId: bigint,
    assignment: AssignmentRecord,
    at: Date,
  ): Promise<void> {
    const released = ['RELEASED', 'CANCELLED'].includes(assignment.status)
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        currentAssignmentId: released ? null : assignment.id,
        currentAssignmentStatus: released ? null : assignment.status,
        currentAssignmentVersion: released ? null : assignment.version,
        currentShiftDailyId: released ? null : assignment.shiftDailyId,
        currentResourceId: released ? null : assignment.resourceId,
        currentResourceName: released ? null : undefined,
        currentResourceDisplayName: released ? null : undefined,
        taskAssignUpdateTime: at,
      },
    })
  }

  private map(row: {
    id: bigint
    taskId: bigint
    currentResourceId: bigint
    currentShiftDailyId: bigint
    status: string
    version: number
    deleted: boolean
    assignedAt: Date
    acceptedAt: Date | null
    releasedAt: Date | null
  }): AssignmentRecord {
    return {
      id: row.id,
      taskId: row.taskId,
      resourceId: row.currentResourceId,
      shiftDailyId: row.currentShiftDailyId,
      status: row.status as AssignmentStatus,
      version: row.version,
      deleted: row.deleted,
      assignedAt: row.assignedAt,
      acceptedAt: row.acceptedAt,
      releasedAt: row.releasedAt,
    }
  }
}

export default AssignmentRepository

// Prisma Json 不接受 bigint；事件 payload 中的业务 ID 统一以字符串保存。
function serializeEventPayload(
  payload: Record<string, unknown>,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(payload, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
  ) as Prisma.InputJsonValue
}
