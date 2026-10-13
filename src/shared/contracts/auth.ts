import { z } from 'zod'
import { idSchema, isoDateSchema } from './common'

export const userSchema = z.object({
  id: idSchema,
  displayName: z.string(),
  username: z.string(),
  email: z.email(),
  ensName: z.string(),
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
})
export type User = z.infer<typeof userSchema>

export const sessionSchema = z.object({
  token: z.string(),
  user: userSchema,
  expiresAt: isoDateSchema,
})
export type Session = z.infer<typeof sessionSchema>

export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres')
  .regex(/[A-Za-z]/, 'Inclua ao menos uma letra')
  .regex(/\d/, 'Inclua ao menos um número')

export const loginRequestSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

export const registerRequestSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição').max(40),
  email: z.email('Informe um e-mail válido'),
  password: passwordSchema,
})
export type RegisterRequest = z.infer<typeof registerRequestSchema>
