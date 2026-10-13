export { AppError, isAppError, kindFromStatus, type AppErrorKind } from './app-error'
export type { FieldErrors } from '@/shared/contracts'
export {
  http,
  onUnauthorized,
  setRequestGate,
  setTokenProvider,
  whenRequestsReady,
  toAppError,
  REQUEST_TIMEOUT_MS,
} from './client'
