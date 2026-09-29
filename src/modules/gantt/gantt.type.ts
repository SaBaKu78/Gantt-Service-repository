export type GanttAvailability = {
  shiftId: string
  startTime: string
  endTime: string
  status: number
}

export type GanttAssignment = {
  id: string
  taskId: string
  resourceId: string
  shiftId: string
  status: string
  version: number
}

export type GanttTaskBar = {
  id: string
  name: string
  startTime: string
  endTime: string
  status: number | null
  color: string | null

  assignmentId: string | null
  assignmentStatus: string | null
  shiftId: string | null
  assignmentVersion: number | null

  outsideShift: boolean
}

export type GanttResourceRow = {
  resourceId: string
  resourceCode: string
  resourceName: string
  resourceDisplayName: string
  resourceStatus: string
  displayOrder: number
  availability: GanttAvailability[]
  assignedTasks: GanttTaskBar[]
}

export type GanttUnassignedTask = GanttTaskBar & {
  reason:
    | 'NO_ACTIVE_ASSIGNMENT'
    | 'RESOURCE_NOT_IN_WINDOW'
    | 'OUTSIDE_SHIFT'
    | 'RESOURCE_NOT_FOUND'
}

export type GanttSearchResult = {
  window: {
    startTime: string
    endTime: string
  }
  rows: GanttResourceRow[]
  unassignedTasks: GanttUnassignedTask[]
  statistics: {
    resourceCount: number
    shiftCount: number
    taskCount: number
    assignedTaskCount: number
    unassignedTaskCount: number
  }
}

export type GanttAssignResult = {
  success: boolean,
  taskId: string
}
