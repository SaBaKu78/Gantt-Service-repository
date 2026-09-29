import z from "zod";

export const GanttSearchSchema = z.object({
  windowStartTime: z.coerce.date(),
  windowEndTime: z.coerce.date(),
  resourceCategoryCode: z.literal('STAF')
})

export const GanttAssignSchema = z.object({
  taskId: z.cuid2(),
  resourceId: z.cuid2(),
  shiftdailyId: z.cuid2()
})

export type GanttSearch = z.infer<typeof GanttSearchSchema>

export type GanttAssign = z.infer<typeof GanttAssignSchema>