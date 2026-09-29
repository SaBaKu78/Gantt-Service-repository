export type AssignmentStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'WORKING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'RELEASED'
  | 'CANCELLED'
  | string

export interface Assignment {
  id: number

  taskId: number
  resourceId: number

  airportCode: string

  taskTypeId?: number | null
  way?: string | null

  roleCode?: string | null
  roleName?: string | null

  status: AssignmentStatus

  // 资源快照，防止资源名称变化后历史记录失真
  resourceCodeSnapshot?: string | null
  resourceNameSnapshot?: string | null
  resourceDisplayNameSnapshot?: string | null
  resourceExternalIdSnapshot?: string | null
  resourceGroupIdSnapshot?: number | null
  relatedResourceId?: number | null
  relatedResourceName?: string | null

  shiftDailyId?: number | null

  notifyStatus?: number | null

  businessType?: number | null
  departmentId?: number | null
  organizationId?: number | null

  updateUserId?: number | null
  updateTime?: string | null

  createUserId?: number | null
  createTime?: string | null

  deleted: boolean

  assignedAt: string
  acceptedAt?: string | null
  releasedAt?: string | null

  version: number
  extra?: Record<string, unknown>
}