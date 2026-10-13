import axios, { AxiosError, type AxiosInstance } from 'axios'
import { apiErrorBodySchema } from '@/shared/contracts'
import { env } from '@/shared/config/env'
import { AppError, kindFromStatus } from './app-error'

type TokenProvider = () => string | null
type UnauthorizedListener = (error: AppError) => void

let requestGate: Promise<unknown> = Promise.resolve()
let tokenProvider: TokenProvider = () => null
const unauthorizedListeners = new Set<UnauthorizedListener>()

/**
 * Requests wait on this gate before leaving the app. Bootstrap uses it to
 * hold calls until the mock worker is ready, without blocking the first paint.
 */
export function setRequestGate(gate: Promise<unknown>): void {
  requestGate = gate
}

/** Resolves once outgoing traffic is allowed (mock worker ready in demo/dev). */
export function whenRequestsReady(): Promise<unknown> {
  return requestGate
}

export function setTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider
}

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

export const REQUEST_TIMEOUT_MS = 10_000

export const http: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use(async (config) => {
  await requestGate
  const token = tokenProvider()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const appError = toAppError(error)
    if (appError.kind === 'unauthorized') {
      unauthorizedListeners.forEach((listener) => listener(appError))
    }
    return Promise.reject(appError)
  },
)

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (axios.isCancel(error)) {
    return new AppError({ kind: 'transient', message: 'Requisição cancelada.', code: 'CANCELED' })
  }
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const parsed = apiErrorBodySchema.safeParse(error.response?.data)
    if (parsed.success) {
      return new AppError({
        kind: kindFromStatus(status),
        message: parsed.data.error.message,
        code: parsed.data.error.code,
        ...(status !== undefined && { status }),
        ...(parsed.data.error.fieldErrors && { fieldErrors: parsed.data.error.fieldErrors }),
      })
    }
    const timedOut = error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT
    return new AppError({
      kind: kindFromStatus(status),
      message: timedOut
        ? 'O servidor demorou para responder. Tente novamente.'
        : status === undefined
          ? 'Falha de conexão. Verifique sua rede e tente novamente.'
          : 'Algo deu errado. Tente novamente.',
      code: timedOut ? 'TIMEOUT' : status === undefined ? 'NETWORK' : `HTTP_${status}`,
      ...(status !== undefined && { status }),
    })
  }
  return new AppError({ kind: 'transient', message: 'Erro inesperado.', code: 'UNKNOWN' })
}
