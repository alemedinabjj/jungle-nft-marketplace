import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { updateProfileRequestSchema, type UpdateProfileRequest, type User } from '@/shared/contracts'
import { applyFieldErrors } from '@/shared/lib/apply-field-errors'
import { Button } from '@/shared/ui/button'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'
import { Input } from '@/shared/ui/input'
import { useAnnounce } from '@/shared/ui/live-region'
import { useUpdateProfile } from '../queries/profile-queries'
import { AvatarField } from './avatar-field'

const FIELDS = ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const

export function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const announce = useAnnounce()
  const [status, setStatus] = useState<{ tone: 'error' | 'success'; message: string } | null>(null)
  const form = useForm<UpdateProfileRequest>({
    resolver: zodResolver(updateProfileRequestSchema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: user.ensName,
      walletNickname: user.walletNickname,
    },
    mode: 'onTouched',
  })
  const { errors, isDirty } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus(null)
    try {
      const saved = await update.mutateAsync(values)
      form.reset({
        displayName: saved.displayName,
        username: saved.username,
        email: saved.email,
        ensName: saved.ensName,
        walletNickname: saved.walletNickname,
      })
      setStatus({ tone: 'success', message: 'Perfil atualizado.' })
      announce('Perfil atualizado.')
    } catch (error) {
      const message = applyFieldErrors(error, form.setError, FIELDS)
      if (message) setStatus({ tone: 'error', message })
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      aria-labelledby="profile-title"
      className="flex flex-col gap-6"
    >
      <h1 id="profile-title" className="text-body-lg font-bold text-text-primary">
        Perfil do colecionador
      </h1>
      {status && <FormAlert tone={status.tone}>{status.message}</FormAlert>}
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <FormField label="Nome de exibição" required error={errors.displayName?.message}>
          {(control) => <Input {...control} {...form.register('displayName')} autoComplete="name" />}
        </FormField>
        <FormField label="Nome de usuário" required error={errors.username?.message}>
          {(control) => <Input {...control} {...form.register('username')} autoComplete="username" />}
        </FormField>
        <FormField label="E-mail" required error={errors.email?.message}>
          {(control) => <Input {...control} {...form.register('email')} type="email" autoComplete="email" />}
        </FormField>
        <FormField label="Nome ENS" required error={errors.ensName?.message}>
          {(control) => (
            <div className="flex">
              <Input {...control} {...form.register('ensName')} className="rounded-r-none" />
              <span className="flex h-10 items-center rounded-r-md border border-l-0 border-border px-3 text-body text-text-secondary">
                .eth
              </span>
            </div>
          )}
        </FormField>
        <FormField label="Apelido da carteira" required error={errors.walletNickname?.message}>
          {(control) => <Input {...control} {...form.register('walletNickname')} />}
        </FormField>
        <AvatarField user={user} />
      </div>
      <Button
        type="submit"
        className="w-[131px]"
        disabled={update.isPending || !isDirty}
        aria-busy={update.isPending}
      >
        {update.isPending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}
