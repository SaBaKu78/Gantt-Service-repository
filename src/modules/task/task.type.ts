export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'CANCELLED'
  | string

export interface Task {
  id: number

  // 关联航班
  flightId: number
  airportCode: string

  // 基本信息
  taskName: string
  taskDate: string
  taskTypeId: number
  taskGroupType: number
  taskRuleCategory: string

  // 计划、预计、实际时间
  estimatedPrepareTime: number
  estimatedStartTimeInMinutes: number
  estimatedEndTimeInMinutes: number

  actualStartTime?: string | null
  actualEndTime?: string | null

  schedulePrepareTime: number
  scheduleStartTime?: string | null
  scheduleEndTime?: string | null
  scheduleDuration: number
  scheduleTravelTime: number

  estimatedStartTripTime?: string | null
  estimatedStartTripTimeInMinutes: number
  estimatedTravelTime: number

  actualStartTripTime?: string | null

  // 位置
  fromLocationId?: number | null
  toLocationId?: number | null

  fromLocation?: string | null
  toLocation?: string | null

  fromLocationTypeCode?: string | null
  toLocationTypeCode?: string | null

  fromLocationAreaId?: number | null
  fromLocationArea?: string | null
  toLocationIntDomType?: string | null

  // 任务属性
  scheduled: boolean
  priority: number
  weight: number
  taskCredit: number
  taskCreditRatio: number

  mustDispatch: boolean
  selfModifiedFlag: number
  locked: boolean

  taskStatus: number
  taskStatusChangeTime?: string | null

  splitted: boolean
  splittedFlag: number

  source: number
  taskSequenceNumber: number
  taskSequenceFlag: number

  isWorkTask: boolean
  isReservedTask: boolean

  // 通知和处理状态
  notifyStatus: number
  notifyTime?: string | null
  notifyAckTime?: string | null
  processFlag: number

  // 资格要求
  baseQualifications: unknown[]
  baseRelatedQualifications: string[]

  // 父子任务
  parentId: number

  // 任务当前派遣摘要
  currentResourceId?: number | null
  currentResourceName?: string | null
  currentResourceDisplayName?: string | null

  currentRelatedResourceId?: number | null
  currentRelatedResourceName?: string | null
  currentRelatedResourceDisplayName?: string | null
  currentRelatedResourceOther2?: string | null

  oldResourceDisplayName?: string | null
  oldRelatedResourceDisplayName?: string | null

  // 当前任务的派遣摘要信息
  taskAssignUserId?: number | null
  taskAssignUserName?: string | null
  taskAssignUpdateTime?: string | null
  taskAssignCreateUserId?: number | null
  taskAssignCreateUserName?: string | null
  taskAssignCreateTime?: string | null

  // 组织和审计
  businessType?: number | null
  departmentId?: number | null
  organizationId?: number | null

  updateUserId?: number | null
  updateUserName?: string | null
  updateTime?: string | null

  createUserId?: number | null
  createUserName?: string | null
  createTime?: string | null

  // 扩展字段
  expandProperties: Record<string, unknown>
  tagIds: number[]

  /**
   * 没有单独建列的原始字段，
   * 例如前端专用展示字段、兼容字段等
   */
  extra?: Record<string, unknown>
}