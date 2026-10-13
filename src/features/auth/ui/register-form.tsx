import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { registerRequestSchema, type Session } from '@/shared/contracts'
import { applyFieldErrors } from '@/shared/lib/apply-field-errors'
import { Button } from '@/shared/ui/button'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'
import { useRegister } from '../queries/session'

const registerFormSchema = registerRequestSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme sua senha') })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })
type RegisterFormValues = z.infer<typeof registerFormSchema>

export function RegisterForm({ onSuccess }: { onSuccess: (session: Session) => void | Promise<void> }) {
  const register = useRegister()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit(async ({ confirmPassword: _confirm, ...values }) => {
    setFormError(null)
    try {
      const session = await register.mutateAsync(values)
      await onSuccess(session)
    } catch (error) {
      setFormError(applyFieldErrors(error, form.setError, ['displayName', 'email', 'password']))
    }
  })

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-3">
      {formError && <FormAlert className="mb-2">{formError}</FormAlert>}
      <FormField label="Nome de usuário" hideLabel error={errors.displayName?.message}>
        {(control) => (
          <Input
            {...control}
            {...form.register('displayName')}
            autoComplete="nickname"
            placeholder="Nome de usuário"
          />
        )}
      </FormField>
      <FormField label="E-mail" hideLabel error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            {...form.register('email')}
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
          />
        )}
      </FormField>
      <FormField
        label="Senha"
        hideLabel
        error={errors.password?.message}
        hint="Mínimo de 8 caracteres, com letras e números."
      >
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register('password')}
            autoComplete="new-password"
            placeholder="Senha"
          />
        )}
      </FormField>
      <FormField label="Confirmar senha" hideLabel error={errors.confirmPassword?.message}>
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register('confirmPassword')}
            autoComplete="new-password"
            placeholder="Confirmar senha"
          />
        )}
      </FormField>
      <Button
        type="submit"
        className="mt-3 h-[45px]"
        disabled={register.isPending}
        aria-busy={register.isPending}
      >
        {register.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
