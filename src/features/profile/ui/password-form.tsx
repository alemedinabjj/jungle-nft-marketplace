import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { changePasswordRequestSchema } from '@/shared/contracts'
import { applyFieldErrors } from '@/shared/lib/apply-field-errors'
import { Button } from '@/shared/ui/button'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'
import { useAnnounce } from '@/shared/ui/live-region'
import { PasswordInput } from '@/shared/ui/password-input'
import { useChangePassword } from '../queries/profile-queries'

const schema = changePasswordRequestSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme a nova senha') })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })
type Values = z.infer<typeof schema>

export function PasswordForm() {
  const change = useChangePassword()
  const announce = useAnnounce()
  const [status, setStatus] = useState<{ tone: 'error' | 'success'; message: string } | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onTouched',
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit(async ({ confirmPassword: _confirm, ...values }) => {
    setStatus(null)
    try {
      await change.mutateAsync(values)
      form.reset()
      setStatus({ tone: 'success', message: 'Senha alterada com sucesso.' })
      announce('Senha alterada com sucesso.')
    } catch (error) {
      const message = applyFieldErrors(error, form.setError, ['currentPassword', 'newPassword'])
      if (message) setStatus({ tone: 'error', message })
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      aria-labelledby="password-title"
      className="flex max-w-[417px] flex-col gap-6"
    >
      <h2 id="password-title" className="text-body-lg font-bold text-text-primary">
        Alterar senha
      </h2>
      {status && <FormAlert tone={status.tone}>{status.message}</FormAlert>}
      <FormField label="Senha atual" error={errors.currentPassword?.message}>
        {(control) => (
          <PasswordInput {...control} {...form.register('currentPassword')} autoComplete="current-password" />
        )}
      </FormField>
      <FormField
        label="Nova senha"
        error={errors.newPassword?.message}
        hint="Mínimo de 8 caracteres, com letras e números."
      >
        {(control) => (
          <PasswordInput {...control} {...form.register('newPassword')} autoComplete="new-password" />
        )}
      </FormField>
      <FormField label="Confirmar nova senha" error={errors.confirmPassword?.message}>
        {(control) => (
          <PasswordInput {...control} {...form.register('confirmPassword')} autoComplete="new-password" />
        )}
      </FormField>
      <Button
        type="submit"
        variant="outline"
        className="w-fit"
        disabled={change.isPending}
        aria-busy={change.isPending}
      >
        {change.isPending ? 'Alterando…' : 'Alterar senha'}
      </Button>
    </form>
  )
}
