import { TriangleAlertIcon } from 'lucide-react'
import { useId, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Label } from './label'

interface FormFieldProps {
  label: string
  /** Visually hide the label (it stays available to assistive tech). */
  hideLabel?: boolean
  required?: boolean
  error?: string | undefined
  hint?: string
  className?: string
  children: (control: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
    'aria-required': boolean | undefined
  }) => ReactElement
}

/** Label + control + hint/error, wired with aria-describedby / aria-invalid. */
export function FormField({ label, hideLabel, required, error, hint, className, children }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className={cn(hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-text-accent">
            *
          </span>
        )}
      </Label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="text-caption text-text-secondary">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1 text-caption text-danger">
      <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
      {children}
    </p>
  )
}
