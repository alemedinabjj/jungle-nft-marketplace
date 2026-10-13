import { http, HttpResponse } from 'msw'
import { loginRequestSchema, registerRequestSchema, type Session } from '@/shared/contracts'
import { getDb, mutateDb } from '../../db/store'
import type { DbState, UserRecord } from '../../db/types'
import { hashPassword, randomId } from '../../lib/crypto'
import {
  API,
  apiError,
  applyScenario,
  bearerToken,
  readJson,
  requireUser,
  validationError,
} from '../../lib/http'
import { getScenario, sessionTtlMs } from '../../scenarios/controller'
import { disconnectUserSockets } from '../../socket/server'

export function toPublicUser({ passwordHash: _hash, passwordSalt: _salt, ...user }: UserRecord) {
  return user
}

function openSession(db: DbState, user: UserRecord): Session {
  const session = {
    token: randomId('tok'),
    userId: user.id,
    expiresAt: new Date(Date.now() + sessionTtlMs()).toISOString(),
  }
  db.sessions.push(session)
  return { token: session.token, expiresAt: session.expiresAt, user: toPublicUser(user) }
}

export const authHandlers = [
  http.post(`${API}/auth/register`, async ({ request }) => {
    const failure = await applyScenario('auth', request)
    if (failure) return failure
    const parsed = registerRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    if (getScenario().forceValidationError) {
      return validationError([{ path: ['displayName'], message: 'Este nome de exibição não é permitido.' }])
    }
    const { displayName, email, password } = parsed.data
    const db = await getDb()
    if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      return apiError(409, 'EMAIL_TAKEN', 'Já existe uma conta com este e-mail.', {
        email: 'Este e-mail já está cadastrado. Entre ou use outro e-mail.',
      })
    }
    const id = randomId('usr')
    const passwordSalt = randomId('salt')
    const passwordHash = await hashPassword(password, passwordSalt)
    const baseUsername =
      email
        .split('@')[0]!
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, '')
        .slice(0, 20) || 'colecionador'
    const session = await mutateDb((state) => {
      const user: UserRecord = {
        id,
        displayName,
        email,
        username: baseUsername,
        bio: '',
        avatarUrl: null,
        passwordHash,
        passwordSalt,
      }
      state.users.push(user)
      state.favorites[id] = []
      state.wallets[id] = []
      return openSession(state, user)
    })
    return HttpResponse.json(session, { status: 201 })
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const failure = await applyScenario('auth', request)
    if (failure) return failure
    const parsed = loginRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    const db = await getDb()
    const user = db.users.find(
      (candidate) => candidate.email.toLowerCase() === parsed.data.email.toLowerCase(),
    )
    const valid = user && (await hashPassword(parsed.data.password, user.passwordSalt)) === user.passwordHash
    if (!user || !valid) {
      return apiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.', {
        password: 'E-mail ou senha incorretos.',
      })
    }
    return HttpResponse.json(await mutateDb((state) => openSession(state, user)))
  }),

  http.get(`${API}/auth/session`, async ({ request }) => {
    await applyScenario('auth', request)
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const token = bearerToken(request)!
    const session = auth.db.sessions.find((candidate) => candidate.token === token)!
    const body: Session = { token, expiresAt: session.expiresAt, user: toPublicUser(auth.user) }
    return HttpResponse.json(body)
  }),

  http.post(`${API}/auth/logout`, async ({ request }) => {
    const token = bearerToken(request)
    if (token) {
      const userId = await mutateDb((state) => {
        const session = state.sessions.find((candidate) => candidate.token === token)
        state.sessions = state.sessions.filter((candidate) => candidate.token !== token)
        return session?.userId ?? null
      })
      if (userId) disconnectUserSockets(userId, token)
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
