import { Prisma } from '../../../generated/prisma/client'
import type { IUnitOfWork } from '../../shared/application/unit-of-work.port'
import {
  assertResourceCanBeAssigned,
  assertShiftCoversTask,
  assertStatusTransition,
  assertTaskCanBeAssigned,
  AssignmentDomainError,
  type AssignmentStatus,
} from './assignment.domain'
import type {
  AssignmentRecord,
  AssignmentResult,
  IAssignmentRepositoryFactory,
} from './assignment.port'
import { AssignInput } from './assignment.schema'

export class AssignmentService {
  constructor({
    unitOfWork,
    assignmentRepositoryFactory,
  }: {
    unitOfWork: IUnitOfWork
    assignmentRepositoryFactory: IAssignmentRepositoryFactory
  }) {
    this.unitOfWork = unitOfWork
    this.repositoryFactory = assignmentRepositoryFactory
  }

  private readonly unitOfWork: IUnitOfWork
  private readonly repositoryFactory: IAssignmentRepositoryFactory

  async assign(query: AssignInput): Promise<AssignmentResult> {
    const now = new Date()
    const commit = await this.unitOfWork.execute(
      async (transaction) => {
        const repository = this.repositoryFactory.create(transaction)
        const task = await repository.findTaskForUpdateById(query.taskId)
        assertTaskCanBeAssigned(task)
        const resource = await repository.findResource(query.resourceId)
        assertResourceCanBeAssigned(resource)
        const shiftDaily = await repository.findShift(query.shiftDailyId)
        assertShiftCoversTask(
          shiftDaily,
          resource.id,
          task.scheduleStartTime,
          task.scheduleEndTime,
        )

        const conflictResult = await repository.findResourceIsConflict({
          resourceId: resource.id,
          taskId: task.id,
          startTime: task.scheduleStartTime,
          endTime: task.scheduleEndTime,
        })
        if (conflictResult) {
          throw new AssignmentDomainError(
            'RESOURCE_CONFLICT',
            'Resource has a conflicting assignment',
          )
        }

        const assignment = await repository.create({
          taskId: task.id,
          resourceId: resource.id,
          shiftDailyId: shiftDaily.id,
          resource,
          taskTypeId: task.taskTypeId,
          way: query.way,
          assignedAt: now,
        })

        await repository.setTaskCurrentAssignment(
          task.id,
          assignment,
          resource,
          now,
        )

        const event = {
          eventType: 'TASK_ASSIGNMENT_CHANGED' as const,
          aggregateType: 'TASK' as const,
          aggregateId: task.id,
          payload: {
            taskId: task.id.toString(),
            assignmentId: assignment.id.toString(),
            resourceId: resource.id.toString(),
            shiftDailyId: shiftDaily.id.toString(),
            status: assignment.status,
          },
          occurredAt: now,
        }

        // 事件和业务数据必须同事务写入；appendEvent 不负责发送通知。
        await repository.appendEvent(event)

        return {
          success: true,
          status: assignment.status,
          event,
          assignmentId: assignment.id,
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    )

    // unitOfWork.execute 返回时，Prisma 已经完成 COMMIT。
    // 当前工程尚未注入 WebSocket publisher，因此事件留在 Outbox 表中，
    // 后续消费者可按 published = false 读取并投递。
    return {
      success: commit.success,
      id: commit.assignmentId,
      status: commit.status,
    }
  } 

  async transition(
    id: bigint,
    status: AssignmentStatus,
    expectedVersion: number,
    now = new Date(),
  ): Promise<AssignmentRecord> {
    return this.unitOfWork.execute(
      async (transaction) => {
        const repository = this.repositoryFactory.create(transaction)
        const current = await repository.findAssignmentById(id)
        if (!current || current.deleted) {
          throw new AssignmentDomainError(
            'TASK_NOT_FOUND',
            'Active assignment not found',
          )
        }
        assertStatusTransition(current.status, status)
        const result = await repository.transition(
          id,
          expectedVersion,
          status,
          now,
        )
        await repository.updateTaskAfterTransition(current.taskId, result, now)
        await repository.appendEvent({
          eventType: 'TASK_ASSIGNMENT_STATUS_CHANGED',
          aggregateType: 'ASSIGNMENT',
          aggregateId: result.id,
          payload: {
            taskId: result.taskId,
            assignmentId: result.id,
            status: result.status,
            version: result.version,
          },
          occurredAt: now,
        })
        return result
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    )
  }
}
