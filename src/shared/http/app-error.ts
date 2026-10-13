import type { FieldErrors } from '@/shared/contracts'

export type AppErrorKind =
  'validation' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'transient'

/** Normalized error every API call rejects with. UI code only ever sees this shape. */
export class AppError extends Error {
  readonly kind: AppErrorKind
  readonly status: number | undefined
  readonly code: string | undefined
  readonly fieldErrors: FieldErrors | undefined

  constructor(params: {
    kind: AppErrorKind
    message: string
    status?: number
    code?: string
    fieldErrors?: FieldErrors
  }) {
    super(params.message)
    this.name = 'AppError'
    this.kind = params.kind
    this.status = params.status
    this.code = params.code
    this.fieldErrors = params.fieldErrors
  }

  get isRetryable(): boolean {
    return this.kind === 'transient'
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError
}

export function kindFromStatus(status: number | undefined): AppErrorKind {
  if (status === undefined) return 'transient'
  if (status === 400 || status === 422) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  return 'transient'
}
