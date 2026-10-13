import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@/shared/contracts'

export type AvatarCheck = { ok: true } | { ok: false; message: string }

/** Client-side guard before uploading (the API validates again). */
export function checkAvatarFile(file: Pick<File, 'type' | 'size'>): AvatarCheck {
  if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: 'Use uma imagem PNG, JPG ou WebP.' }
  }
  if (file.size > 5 * AVATAR_MAX_BYTES) {
    return { ok: false, message: 'A imagem é muito grande (máximo 5 MB antes do ajuste).' }
  }
  return { ok: true }
}
