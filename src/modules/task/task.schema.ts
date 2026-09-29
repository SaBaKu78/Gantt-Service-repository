import z from "zod";


// ======== 入参 ========
export const TaskSearchSchema = z.object({
  windowStartTime: z.coerce.date(),
  windowEndTime: z.coerce.date(),
})


// ======== 出参 ========


// ======== 类型 ========
export type TaskSearchParams = z.infer<typeof TaskSearchSchema>