import { HttpResponse } from 'msw'
import type { ApiErrorBody, FieldErrors } from '@/shared/contracts'
import { getDb } from '../db/store'
import type { DbState, UserRecord } from '../db/types'
import { failureFor, simulateLatency } from '../scenarios/controller'
import type { EndpointGroup } from '../scenarios/registry'

/** All REST routes live under this prefix on any origin. */
export const API = '*/api'

export function apiError(status: number, code: string, message: string, fieldErrors?: FieldErrors) {
  const body: ApiErrorBody = { error: { code, message, ...(fieldErrors && { fieldErrors }) } }
  return HttpResponse.json(body, { status })
}

/**
 * Applies the active scenario: deterministic latency, then any configured
 * failure for this endpoint group. Returns a response to short-circuit with.
 */
export async function applyScenario(group: EndpointGroup, request: Request): Promise<Response | null> {
  await simulateLatency(group)
  const url = new URL(request.url)
  const failure = failureFor(group, `${request.method} ${url.pathname}`)
  switch (failure) {
    case null:
      return null
    case 'network':
      return HttpResponse.error()
    case 'server':
      return apiError(500, 'INTERNAL', 'Erro interno no servidor simulado.')
    case 'flaky':
      return apiError(503, 'UNAVAILABLE', 'Serviço temporariamente indisponível.')
    case 'forbidden':
      return apiError(403, 'FORBIDDEN', 'Você não tem permissão para acessar este recurso.')
  }
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

export type AuthResult = { ok: true; db: DbState; user: UserRecord } | { ok: false; response: Response }

/** Resolve the authenticated user or a 401 response (missing/expired session). */
export async function requireUser(request: Request): Promise<AuthResult> {
  const db = await getDb()
  const token = bearerToken(request)
  if (!token) {
    return { ok: false, response: apiError(401, 'UNAUTHENTICATED', 'Faça login para continuar.') }
  }
  const session = db.sessions.find((candidate) => candidate.token === token)
  if (!session || Date.parse(session.expiresAt) <= Date.now()) {
    return { ok: false, response: apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.') }
  }
  const user = db.users.find((candidate) => candidate.id === session.userId)
  if (!user)
    return { ok: false, response: apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.') }
  return { ok: true, db, user }
}

/** Optional auth: user if a valid token is present, otherwise null. */
export async function optionalUser(request: Request): Promise<UserRecord | null> {
  const result = await requireUser(request)
  return result.ok ? result.user : null
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

/** Convert a Zod error into the standard 422 response with per-field messages. */
export function validationError(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: FieldErrors = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || 'form'
    fieldErrors[key] ??= issue.message
  }
  return apiError(422, 'VALIDATION', 'Revise os campos destacados.', fieldErrors)
}

export function nowIso(): string {
  return new Date().toISOString()
}
