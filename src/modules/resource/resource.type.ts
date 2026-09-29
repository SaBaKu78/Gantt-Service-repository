export interface Resource {
  id: number
  code: string
  name: string
  shortName: string
  displayName: string

  openingTime: string
  closingTime: string
  isCrossDay: boolean

  resourceCategoryCode: string
  resourceTypeCode: string
  resourceStatus: string

  patternId: number
  priority: number
  dispatched: number

  resourceLinkId: number
  resourceGroupId: number
  bindRelatedResourceTypeCode: string[]
  currentRelatedResourceId?: number
  currentRelatedResourceName?: string
  currentRelatedResourceDisplayName?: string

  latestLongitude?: number
  latestLatitude?: number
  latestPositionChangeTime?: string | null

  dataSource: string
  relatedExternalId: string
  selfModifiedFlag: number
  displayed: boolean
  displayOrder: number

  airportCode: string
  businessType: number
  coeft?: number
  departmentId: number
  organizationId: number
  updateUserId: number
  updateTime: string

  expandProperties: Record<string, unknown>
  tagIds: number[]
  resourceLink: Record<string, unknown>
  labelNames: string[]
  lazyLoadFlags: string[]
  resourceWorkLocationList: unknown[]
  vehicleType?: string

  vehicleTypeName: string
  vehicleTypeDisplayOrder: number
  calculatedRelatedResourceId?: number
  bindRelatedResourceId?: number
  bindRelatedResourceId1?: number
  bindRelatedResourceName?: string
  bindRelatedResourceDisplayName?: string
  allVehicle: unknown[]

  calculatedRelatedResourceName: string
  calculatedRelatedResourceDisplayName: string
}

export interface ResourceShcema {
  resourceCategoryCode?: string
}