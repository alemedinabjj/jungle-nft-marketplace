import { z } from 'zod'

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true')

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_REALTIME_URL: z.url().default('wss://realtime.mock'),
  VITE_ENABLE_MOCKS: booleanString,
})

export type Env = z.infer<typeof envSchema>

/** Typed, validated environment. Fails fast on boot if misconfigured. */
export const env: Env = envSchema.parse(import.meta.env)
