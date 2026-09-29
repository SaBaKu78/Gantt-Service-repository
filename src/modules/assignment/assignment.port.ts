import type { AssignmentStatus } from './assignment.domain'
import type { Prisma } from '../../../generated/prisma/client'

export interface AssignmentTask {
  id: bigint
  taskTypeId: bigint
  deleted: boolean
  locked: boolean
  scheduleStartTime: Date
  scheduleEndTime: Date
  currentAssignmentId: bigint | null
}

export interface AssignmentResource {
  id: bigint
  code: string
  name: string
  displayName: string
  resourceExternalId: string
  resourceGroupId: bigint
  resourceStatus: string
  displayed: boolean
}

export interface AssignmentShift {
  id: bigint
  resourceId: bigint
  dailyOnOff: number
  plannedStartTime: Date
  plannedEndTime: Date
}

export interface AssignmentRecord {
  id: bigint
  taskId: bigint
  resourceId: bigint
  shiftDailyId: bigint
  status: AssignmentStatus
  version: number
  deleted: boolean
  assignedAt: Date
  acceptedAt: Date | null
  releasedAt: Date | null
}

export interface AssignmentResult {
  id: bigint
  success: boolean
  status: AssignmentStatus
}

export type AssignmentEventType =
  | 'TASK_ASSIGNMENT_CHANGED'
  | 'TASK_ASSIGNMENT_STATUS_CHANGED'

export interface AppendEventInput {
  eventType: AssignmentEventType
  aggregateType: 'TASK' | 'ASSIGNMENT'
  aggregateId: bigint
  payload: Record<string, unknown>
  occurredAt: Date
}

export interface IAssignmentRepository {
  findTaskForUpdateById(taskId: bigint): Promise<AssignmentTask | null>
  findResource(resourceId: bigint): Promise<AssignmentResource | null>
  findShift(shiftId: bigint): Promise<AssignmentShift | null>
  findAssignmentById(id: bigint): Promise<AssignmentRecord | null>
  findResourceIsConflict(input: {
    resourceId: bigint,
    taskId?: bigint,
    startTime: Date,
    endTime: Date
  }): Promise<AssignmentRecord | null>
  create(input: {
    taskId: bigint
    resourceId: bigint
    shiftDailyId: bigint
    resource: AssignmentResource
    taskTypeId?: bigint
    way?: number
    assignedAt: Date
  }): Promise<AssignmentRecord>
  transition(id: bigint, fromVersion: number, status: AssignmentStatus, at: Date): Promise<AssignmentRecord>
  setTaskCurrentAssignment(
    taskId: bigint,
    assignment: AssignmentRecord,
    resource: AssignmentResource,
    at: Date,
  ): Promise<void>
  updateTaskAfterTransition(
    taskId: bigint,
    assignment: AssignmentRecord,
    at: Date,
  ): Promise<void>
  appendEvent(input: AppendEventInput): Promise<bigint>
}

export interface IAssignmentRepositoryFactory {
  create(transaction: Prisma.TransactionClient): IAssignmentRepository
}
