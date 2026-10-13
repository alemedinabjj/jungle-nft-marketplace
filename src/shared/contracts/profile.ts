import { z } from 'zod'
import { passwordSchema } from './auth'

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use ao menos 3 caracteres')
  .max(24, 'Use no máximo 24 caracteres')
  .regex(/^[a-z0-9_.]+$/, 'Use apenas letras minúsculas, números, ponto ou _')

export const updateProfileRequestSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição').max(40),
  username: usernameSchema,
  email: z.email('Informe um e-mail válido'),
  bio: z.string().max(280, 'Use no máximo 280 caracteres'),
})
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>

export const AVATAR_MAX_BYTES = 1_000_000
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const updateAvatarRequestSchema = z.object({
  /** data: URL of the cropped avatar (simulated upload). */
  dataUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/, 'Formato de imagem não suportado'),
})
export type UpdateAvatarRequest = z.infer<typeof updateAvatarRequestSchema>

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: passwordSchema,
})
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
