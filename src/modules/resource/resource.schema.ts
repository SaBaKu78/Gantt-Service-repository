import {z} from "zod"


// ======== 入参 ========
export const ResourceSearchSchema = z.object({
  resourceCategoryCode: z.literal('STAF')
})



// ======== 出参 ========


// ======== 类型 ========

export type ResourceSearchParams = z.infer<typeof ResourceSearchSchema>