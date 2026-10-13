import { http, HttpResponse } from 'msw'
import {
  AVATAR_MAX_BYTES,
  changePasswordRequestSchema,
  updateAvatarRequestSchema,
  updateProfileRequestSchema,
} from '@/shared/contracts'
import { mutateDb } from '../../db/store'
import { hashPassword, randomId } from '../../lib/crypto'
import { API, apiError, applyScenario, readJson, requireUser, validationError } from '../../lib/http'
import { getScenario } from '../../scenarios/controller'
import { toPublicUser } from '../auth/handlers'

export const profileHandlers = [
  http.get(`${API}/profile`, async ({ request }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const failure = await applyScenario('profile', request)
    if (failure) return failure
    return HttpResponse.json(toPublicUser(auth.user))
  }),

  http.put(`${API}/profile`, async ({ request }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const failure = await applyScenario('profile', request)
    if (failure) return failure
    const parsed = updateProfileRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    if (getScenario().forceValidationError) {
      return validationError([{ path: ['username'], message: 'Este nome de usuário está reservado.' }])
    }
    const { email, username } = parsed.data
    if (
      auth.db.users.some(
        (user) => user.id !== auth.user.id && user.email.toLowerCase() === email.toLowerCase(),
      )
    ) {
      return apiError(409, 'EMAIL_TAKEN', 'Este e-mail já está em uso.', {
        email: 'Este e-mail já está em uso por outra conta.',
      })
    }
    if (auth.db.users.some((user) => user.id !== auth.user.id && user.username === username)) {
      return apiError(409, 'USERNAME_TAKEN', 'Este nome de usuário já está em uso.', {
        username: 'Escolha outro nome de usuário.',
      })
    }
    const updated = await mutateDb(() => Object.assign(auth.user, parsed.data))
    return HttpResponse.json(toPublicUser(updated))
  }),

  http.put(`${API}/profile/avatar`, async ({ request }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const failure = await applyScenario('profile', request)
    if (failure) return failure
    const parsed = updateAvatarRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    // base64 → bytes ≈ length * 3/4
    const bytes = Math.floor((parsed.data.dataUrl.length - parsed.data.dataUrl.indexOf(',') - 1) * 0.75)
    if (bytes > AVATAR_MAX_BYTES) {
      return apiError(422, 'AVATAR_TOO_LARGE', 'A imagem excede 1 MB.', {
        dataUrl: 'Escolha uma imagem de até 1 MB.',
      })
    }
    const updated = await mutateDb(() => {
      auth.user.avatarUrl = parsed.data.dataUrl
      return auth.user
    })
    return HttpResponse.json(toPublicUser(updated))
  }),

  http.put(`${API}/profile/password`, async ({ request }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const failure = await applyScenario('profile', request)
    if (failure) return failure
    const parsed = changePasswordRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    const currentHash = await hashPassword(parsed.data.currentPassword, auth.user.passwordSalt)
    if (currentHash !== auth.user.passwordHash) {
      return apiError(422, 'INVALID_PASSWORD', 'Senha atual incorreta.', {
        currentPassword: 'Senha atual incorreta.',
      })
    }
    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return apiError(422, 'SAME_PASSWORD', 'A nova senha deve ser diferente.', {
        newPassword: 'Use uma senha diferente da atual.',
      })
    }
    const salt = randomId('salt')
    const hash = await hashPassword(parsed.data.newPassword, salt)
    await mutateDb(() => {
      auth.user.passwordSalt = salt
      auth.user.passwordHash = hash
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
