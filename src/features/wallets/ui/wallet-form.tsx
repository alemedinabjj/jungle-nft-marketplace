import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  NETWORK_LABELS,
  networkSchema,
  upsertWalletRequestSchema,
  WALLET_PROVIDER_LABELS,
  walletProviderSchema,
  type UpsertWalletRequest,
  type Wallet,
  type WalletSlot,
} from '@/shared/contracts'
import { applyFieldErrors } from '@/shared/lib/apply-field-errors'
import { Button } from '@/shared/ui/button'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'
import { Input } from '@/shared/ui/input'
import { useAnnounce } from '@/shared/ui/live-region'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useUpsertWallet } from '../queries/wallets-queries'

interface WalletFormProps {
  slot: WalletSlot
  wallet: Wallet | undefined
  defaults?: Partial<UpsertWalletRequest>
  onSaved?: (wallet: Wallet) => void
}

export function WalletForm({ slot, wallet, defaults, onSaved }: WalletFormProps) {
  const upsert = useUpsertWallet()
  const announce = useAnnounce()
  const [status, setStatus] = useState<{ tone: 'error' | 'success'; message: string } | null>(null)
  const form = useForm<UpsertWalletRequest>({
    resolver: zodResolver(upsertWalletRequestSchema),
    defaultValues: {
      label: wallet?.label ?? defaults?.label ?? '',
      network: wallet?.network ?? defaults?.network ?? 'ethereum',
      provider: wallet?.provider ?? defaults?.provider ?? 'metamask',
      address: wallet?.address ?? defaults?.address ?? '',
    },
    mode: 'onTouched',
  })
  const { errors } = form.formState
  const prefix = `wallet-${slot}`

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus(null)
    try {
      const saved = await upsert.mutateAsync({ slot, body: values })
      const message = slot === 'primary' ? 'Carteira principal salva.' : 'Carteira secundária salva.'
      setStatus({
        tone: 'success',
        message: saved.status === 'disconnected' ? `${message} Conecte-a para usar no pagamento.` : message,
      })
      announce(message)
      onSaved?.(saved)
    } catch (error) {
      const message = applyFieldErrors(error, form.setError, ['label', 'network', 'provider', 'address'])
      if (message) setStatus({ tone: 'error', message })
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      className="flex flex-col gap-5"
      aria-label={slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'}
    >
      {status && <FormAlert tone={status.tone}>{status.message}</FormAlert>}
      <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
        <FormField label="Apelido da carteira" required error={errors.label?.message}>
          {(control) => (
            <Input
              {...control}
              {...form.register('label')}
              id={`${prefix}-label`}
              placeholder="Ex.: Cofre principal"
            />
          )}
        </FormField>
        <FormField label="Rede" required error={errors.network?.message}>
          {(control) => (
            <Controller
              control={form.control}
              name="network"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger {...control} onBlur={field.onBlur}>
                    <SelectValue placeholder="Selecione uma rede" />
                  </SelectTrigger>
                  <SelectContent>
                    {networkSchema.options.map((network) => (
                      <SelectItem key={network} value={network}>
                        {NETWORK_LABELS[network]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
        <FormField label="Endereço da carteira" required error={errors.address?.message}>
          {(control) => (
            <Input
              {...control}
              {...form.register('address')}
              placeholder="Endereço 0x da carteira"
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </FormField>
        <FormField label="Tipo de carteira" required error={errors.provider?.message}>
          {(control) => (
            <Controller
              control={form.control}
              name="provider"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger {...control} onBlur={field.onBlur}>
                    <SelectValue placeholder="Selecione uma carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    {walletProviderSchema.options.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {WALLET_PROVIDER_LABELS[provider]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
      </div>
      <Button type="submit" className="w-fit" disabled={upsert.isPending} aria-busy={upsert.isPending}>
        {upsert.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
