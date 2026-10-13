import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { isAppError } from '@/shared/http'

/**
 * Maps API `fieldErrors` onto react-hook-form fields. Returns the message to
 * show at form level when the error isn't attached to a known field.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  if (!isAppError(error)) return 'Erro inesperado. Tente novamente.'
  let attached = false
  for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
    if ((fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !attached })
      attached = true
    }
  }
  return attached ? null : error.message
}
