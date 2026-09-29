export type ShiftDailyStatus =
  | 'PLANNED'
  | 'CONFIRMED'
  | 'WORKING'
  | 'COMPLETED'
  | 'ABSENT'
  | 'CANCELLED'

export type ShiftCode =
  | 'DAY'
  | 'MORNING'
  | 'EVENING'
  | 'NIGHT'
  | string

export interface ShiftDaily {
  id: number

  resourceId: number

  // 如果班次与某个航班关联，则填写；普通日班次可以为空
  flightId?: number | null

  airportCode: string
  shiftDate: string

  shiftCode: ShiftCode
  shiftName?: string

  plannedStartTime: string
  plannedEndTime: string

  actualStartTime?: string | null
  actualEndTime?: string | null

  status: ShiftDailyStatus

  workLocation?: string

  departmentId?: number
  organizationId?: number

  displayOrder: number
  version: number

  extra: Record<string, unknown>

  createdAt: string
  updatedAt: string
}