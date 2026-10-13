import { z } from 'zod'

/** Standard error envelope returned by every failing endpoint. */
export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.string()).optional(),
  }),
})

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

export type FieldErrors = Record<string, string>
