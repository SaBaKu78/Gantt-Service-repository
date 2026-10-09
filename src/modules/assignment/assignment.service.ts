import { Prisma } from '../../../generated/prisma/client'
import type { IUnitOfWork } from '../../shared/application/unit-of-work.port'
import {
  assertAssignmentIsConflict,
  assertResourceCanBeAssigned,
  assertShiftCoversTask,
  assertStatusTransition,
  assertTaskAssignmentMatch,
  assertTaskCanBeAssigned,
  assertTaskIsLeisure,
  AssignmentDomainError,
  type AssignmentStatus,
} from './assignment.domain'
import type {
  AssignmentRecord,
  AssignmentResult,
  IAssignmentRepositoryFactory,
  ReassignResult,
} from './assignment.port'
import { AssignInput, ReassignInput } from './assignment.schema'

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

  //TODO: 推送ws
  async assign(query: AssignInput): Promise<AssignmentResult> {
    const now = new Date()
    const commit = await this.unitOfWork.execute(
      async (transaction) => {
        const repository = this.repositoryFactory.create(transaction)
        // Lock order is part of the write contract: Task first, Resource second.
        // Other write paths must use the same order to avoid lock cycles.
        const task = await repository.findTaskForUpdateById(query.taskId)
        assertTaskCanBeAssigned(task)
        assertTaskIsLeisure(task)
        // Lock the resource before checking overlap so concurrent assignments
        // for the same resource cannot pass the check at the same time.
        const resource = await repository.findResourceForUpdateById(
          query.resourceId,
        )
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

  //TODO: 推送ws
  async reAssign(query: ReassignInput): Promise<ReassignResult> {
    // 1. 开启事务 ✔
    // 2. 锁定 Task ✔
    // 3. 校验 Task 存在、未删除、未锁定✔
    // 4. 校验 Task.currentAssignmentId 不为空✔
    // 5. 锁定当前 Assignment✔
    // 6. 校验当前 Assignment 仍有效✔
    // 7. 锁定目标 Resource✔
    // 8. 查询并校验目标 ShiftDaily✔
    // 9. 校验目标班次属于目标 Resource✔
    // 10. 校验目标班次有效且完整覆盖任务时间✔
    // 11. 检查目标 Resource 时间冲突✔
    // 12. 创建新的 Assignment✔
    // 13. 将旧 Assignment 标记为 RELEASED✔
    // 14. 更新 Task.currentAssignmentId 指向新 Assignment✔
    // 15. 写入改派事件✔
    // 16. 提交事务✔
    // 17. 提交成功后推送 WebSocket
    // 18. 返回新 Assignment✔
    const now = new Date()
    return this.unitOfWork.execute(
      async (transaction) => {
        const repository = this.repositoryFactory.create(transaction)
        const task = await repository.findTaskForUpdateById(query.taskId)
        assertTaskCanBeAssigned(task)
        assertTaskAssignmentMatch(task, query.sourceAssignmentId)
        const sourceAssignment = await repository.findAssignmentForUpdate(
          query.sourceAssignmentId,
          task.id,
        )
        assertAssignmentIsConflict(
          sourceAssignment.version,
          query.sourceAssignmentVersion,
        )
        const resource = await repository.findResourceForUpdateById(
          query.resourceId,
        )
        assertResourceCanBeAssigned(resource)
        const shiftdaily = await repository.findShift(query.shiftDailyId)
        assertShiftCoversTask(
          shiftdaily,
          resource.id,
          task.scheduleStartTime,
          task.scheduleEndTime,
        )
        const conflict = await repository.findResourceIsConflict({
          resourceId: resource.id,
          taskId: task.id,
          startTime: task.scheduleStartTime,
          endTime: task.scheduleEndTime,
        })
        if (conflict) {
          throw new AssignmentDomainError(
            'RESOURCE_CONFLICT',
            'Resource has a conflicting assignment',
          )
        }

        const newAssignment = await repository.create({
          taskId: task.id,
          resourceId: resource.id,
          shiftDailyId: shiftdaily.id,
          resource,
          taskTypeId: task.taskTypeId,
          way: query.way || 1,
          assignedAt: now,
        })

        await repository.transition(
          sourceAssignment.id,
          sourceAssignment.version,
          'RELEASED',
          now,
        )

        await repository.setTaskCurrentAssignment(
          task.id,
          newAssignment,
          resource,
          now,
        )

        await repository.appendEvent({
          eventType: 'TASK_ASSIGNMENT_CHANGED',
          aggregateType: 'TASK',
          aggregateId: task.id,
          payload: {
            operation: 'REASSIGN',
            taskId: task.id,
            oldAssignmentId: sourceAssignment.id,
            newAssignmentId: newAssignment.id,
            oldResourceId: sourceAssignment.resourceId,
            newResourceId: newAssignment.resourceId,
            oldShiftDailyId: sourceAssignment.shiftDailyId,
            newShiftDailyId: newAssignment.shiftDailyId,
            status: newAssignment.status,
          },
          occurredAt: now,
        })

        return {
          success: true,
          operation: 'REASSIGN',
          taskId: task.id,
          sourceAssignmentId: sourceAssignment.id,
          sourceAssignmentVersion: sourceAssignment.version,
          assignmentId: newAssignment.id,
          assignmentVersion: newAssignment.version,
          resourceId: resource.id,
          shiftDailyId: shiftdaily.id,
          status: newAssignment.status,
          version: newAssignment.version,
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    )
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
