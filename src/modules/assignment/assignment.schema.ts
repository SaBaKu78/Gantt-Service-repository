import { z } from 'zod'

const id = z.string().regex(/^\d+$/)
const status = z.enum([
  'ASSIGNED',
  'ACCEPTED',
  'WORKING',
  'COMPLETED',
  'RELEASED',
  'CANCELLED',
])

export const assignmentCreateSchema = {
  body: z.object({
    taskId: id,
    resourceId: id,
    shiftDailyId: id,
    taskTypeId: id.optional(),
    way: z.number().int().optional(),
  }),
}

export const assignmentTransitionSchema = {
  params: z.object({ id }),
  body: z.object({ status, version: z.number().int().positive() }),
}

export const assignInputSchema = z.object({
  taskId: id.transform(BigInt),
  resourceId: id.transform(BigInt),
  shiftDailyId: id.transform(BigInt),
  taskTypeId: id.transform(BigInt).optional(),
  way: z.number().int().optional(),
})

export type AssignInput = z.infer<typeof assignInputSchema>
