import type { Prisma } from '../../../generated/prisma/client'
import type { Window } from './gantt.domain'

export type GanttResource = {
  id: bigint
  code: string
  name: string
  displayName: string
  resourceStatus: string
  displayOrder: number
}

export type GanttShift = {
  id: bigint
  resourceId: bigint
  startTime: Date
  endTime: Date
  dailyOnOff: number
}

export type GanttTask = {
  id: bigint
  // Task is the authoritative pointer to the current assignment.
  currentAssignmentId: bigint | null
  taskName: string
  taskTypeId: bigint
  taskTypeName: string

  taskStatus: number
  locked: boolean
  notifyStatus: number

  scheduleStartTime: Date
  scheduleEndTime: Date
  taskTime: Date

  flightId: bigint
  flightNum: string | null
  inFlightNum: string | null
  outFlightNum: string | null

  inBoundFlightStatus: number | null
  outBoundFlightStatus: number | null

  inBoundStandName: string | null
  outBoundStandName: string | null

  description: string | null
}

export type GanttAssignment = {
  id: bigint
  taskId: bigint
  resourceId: bigint
  shiftId: bigint
  status: string
  version: number
  deleted: boolean
  assignedAt: Date
}

export interface IGanttRepository {
  findResources(categoryCode: string): Promise<GanttResource[]>

  findShifts(resourceIds: bigint[], window: Window): Promise<GanttShift[]>

  findTasks(window: Window): Promise<GanttTask[]>

  findActiveAssignments(taskIds: bigint[]): Promise<GanttAssignment[]>
}

export interface IGanttRepositoryFactory {
  create(transaction: Prisma.TransactionClient): IGanttRepository
}
