import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { loginRequestSchema, type LoginRequest, type Session } from '@/shared/contracts'
import { applyFieldErrors } from '@/shared/lib/apply-field-errors'
import { Button } from '@/shared/ui/button'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'
import { useLogin } from '../queries/session'
import { UnavailableSocialLogin } from './unavailable-social-login'

export function LoginForm({ onSuccess }: { onSuccess: (session: Session) => void | Promise<void> }) {
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const session = await login.mutateAsync(values)
      await onSuccess(session)
    } catch (error) {
      setFormError(applyFieldErrors(error, form.setError, ['email', 'password']))
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      className="flex flex-col gap-3"
      aria-describedby={formError ? 'login-error' : undefined}
    >
      {formError && <FormAlert className="mb-2">{formError}</FormAlert>}
      <FormField label="E-mail" hideLabel error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            {...form.register('email')}
            type="email"
            autoComplete="email"
            placeholder="contato@email.com"
          />
        )}
      </FormField>
      <FormField label="Senha" hideLabel error={errors.password?.message}>
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register('password')}
            autoComplete="current-password"
            placeholder="Senha"
          />
        )}
      </FormField>
      <p className="text-right text-body text-text-secondary">
        <span
          title="Recuperação de senha indisponível nesta demonstração"
          aria-disabled="true"
          className="cursor-not-allowed opacity-70"
        >
          Esqueceu a senha? <span className="sr-only">(indisponível nesta demonstração)</span>
        </span>
      </p>
      <Button type="submit" className="mt-3 h-[45px]" disabled={login.isPending} aria-busy={login.isPending}>
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
      <UnavailableSocialLogin />
    </form>
  )
}
