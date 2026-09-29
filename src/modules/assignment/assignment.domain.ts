export const assignmentStatuses = [
  'ASSIGNED',
  'ACCEPTED',
  'WORKING',
  'COMPLETED',
  'RELEASED',
  'CANCELLED',
] as const

export type AssignmentStatus = (typeof assignmentStatuses)[number]

export type AssignmentErrorCode =
  | 'TASK_NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'
  | 'SHIFT_NOT_FOUND'
  | 'TASK_LOCKED'
  | 'RESOURCE_UNAVAILABLE'
  | 'SHIFT_RESOURCE_MISMATCH'
  | 'SHIFT_TIME_MISMATCH'
  | 'TASK_ALREADY_ASSIGNED'
  | 'RESOURCE_CONFLICT'
  | 'INVALID_STATUS_TRANSITION'
  | 'VERSION_CONFLICT'

export class AssignmentDomainError extends Error {
  constructor(
    public readonly code: AssignmentErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'AssignmentDomainError'
  }
}

export const assignmentTransitions: Record<AssignmentStatus, readonly AssignmentStatus[]> = {
  ASSIGNED: ['ACCEPTED', 'RELEASED', 'CANCELLED'],
  ACCEPTED: ['WORKING', 'RELEASED', 'CANCELLED'],
  WORKING: ['COMPLETED', 'RELEASED'],
  COMPLETED: [],
  RELEASED: [],
  CANCELLED: [],
}

export function assertStatusTransition(
  from: AssignmentStatus,
  to: AssignmentStatus,
): void {
  if (!assignmentTransitions[from]?.includes(to)) {
    throw new AssignmentDomainError(
      'INVALID_STATUS_TRANSITION',
      `Cannot transition assignment from ${from} to ${to}`,
    )
  }
}

export function assertTaskCanBeAssigned(task: {
  deleted: boolean
  locked: boolean
  currentAssignmentId: bigint | null
  scheduleStartTime: Date
  scheduleEndTime: Date
} | null): asserts task is {
  deleted: boolean
  locked: boolean
  currentAssignmentId: bigint | null
  scheduleStartTime: Date
  scheduleEndTime: Date
} {
  if (!task) {
    throw new AssignmentDomainError('TASK_NOT_FOUND', 'Task is not found')
  }
  if (task.deleted) {
    throw new AssignmentDomainError('TASK_NOT_FOUND', 'Deleted tasks cannot be assigned')
  }
  if (task.locked) {
    throw new AssignmentDomainError('TASK_LOCKED', 'Locked tasks cannot be assigned')
  }
  if (task.currentAssignmentId !== null) {
    throw new AssignmentDomainError('TASK_ALREADY_ASSIGNED', 'Task already has an active assignment')
  }
  if (task.scheduleStartTime >= task.scheduleEndTime) {
    throw new AssignmentDomainError('SHIFT_TIME_MISMATCH', 'Task schedule interval is invalid')
  }
}

export function assertResourceCanBeAssigned(resource: {
  resourceStatus: string
  displayed: boolean
} | null): asserts resource is {
  resourceStatus: string
  displayed: boolean
} {
  if(!resource){
    throw new AssignmentDomainError('RESOURCE_NOT_FOUND', 'Resource is not found')
  }
  if (!resource.displayed || !['ON', 'ACTIVE', 'ENABLED'].includes(resource.resourceStatus.toUpperCase())) {
    throw new AssignmentDomainError('RESOURCE_UNAVAILABLE', 'Resource is not available for assignment')
  }
}
export function assertShiftCoversTask(
  shift: { resourceId: bigint; dailyOnOff: number; plannedStartTime: Date; plannedEndTime: Date } | null,
  resourceId: bigint,
  taskStart: Date,
  taskEnd: Date,
): asserts shift is {
  resourceId: bigint
  dailyOnOff: number
  plannedStartTime: Date
  plannedEndTime: Date
} {

  if(!shift){
    throw new AssignmentDomainError('SHIFT_NOT_FOUND', 'Shift is not found')
  }

  if (shift.resourceId !== resourceId) {
    throw new AssignmentDomainError('SHIFT_RESOURCE_MISMATCH', 'Shift does not belong to resource')
  }
  if (shift.dailyOnOff !== 1) {
    throw new AssignmentDomainError('SHIFT_TIME_MISMATCH', 'Shift is disabled')
  }

  // 班次必须完整覆盖任务区间；仅有交集不能保证任务执行期间一直在岗。
  const coversTask =
    shift.plannedStartTime <= taskStart &&
    shift.plannedEndTime >= taskEnd

  if (!coversTask) {
    throw new AssignmentDomainError(
      'SHIFT_TIME_MISMATCH',
      'Shift does not cover the complete task interval',
    )
  }
}
