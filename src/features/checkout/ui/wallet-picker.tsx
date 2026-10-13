import { Link } from '@tanstack/react-router'
import { Plug, PlugZap } from 'lucide-react'
import { WALLET_PROVIDER_LABELS, type Wallet } from '@/shared/contracts'
import { shortAddress, useConnectWallet, useDisconnectWallet } from '@/features/wallets'
import { isAppError } from '@/shared/http'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { useAnnounce } from '@/shared/ui/live-region'

interface WalletPickerProps {
  wallets: Wallet[]
  value: string
  onChange: (walletId: string) => void
  error?: string | undefined
}

/** "Carteira e rede": registered wallets as radios + simulated connect/disconnect. */
export function WalletPicker({ wallets, value, onChange, error }: WalletPickerProps) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const announce = useAnnounce()
  const selected = wallets.find((wallet) => wallet.id === value)
  const actionError = connect.error ?? disconnect.error

  if (wallets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-soft p-4 text-body text-text-secondary">
        Você ainda não cadastrou uma carteira.{' '}
        <Link
          to="/wallets"
          search={{ redirect: '/checkout' }}
          className="font-bold text-text-accent hover:underline"
        >
          Cadastrar carteira
        </Link>
      </div>
    )
  }

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={error ? 'wallet-error' : undefined}>
      <legend className="mb-1 text-center text-body-lg font-bold text-text-primary">Carteira e rede</legend>
      <span className="self-start rounded border border-border-soft bg-surface-dark px-2 py-1 text-tiny font-bold tracking-wide text-text-accent">
        METAMASK · WALLETCONNECT · COINBASE
      </span>
      {wallets.map((wallet) => {
        const checked = wallet.id === value
        return (
          <label
            key={wallet.id}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-body transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              checked ? 'border-primary bg-surface-card' : 'border-border-soft hover:border-secondary',
            )}
          >
            <input
              type="radio"
              name="walletId"
              value={wallet.id}
              checked={checked}
              onChange={() => onChange(wallet.id)}
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="flex flex-1 flex-col">
              <span className="text-text-primary">
                {WALLET_PROVIDER_LABELS[wallet.provider]}{' '}
                <span className="text-text-secondary">
                  · {wallet.slot === 'primary' ? 'principal' : 'secundária'}
                </span>
              </span>
              <span className="text-caption text-text-secondary">{shortAddress(wallet.address)}</span>
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-tiny font-bold',
                wallet.status === 'connected'
                  ? 'bg-success/15 text-success'
                  : 'bg-surface-dark text-text-secondary',
              )}
            >
              {wallet.status === 'connected' ? 'Conectada' : 'Desconectada'}
            </span>
          </label>
        )
      })}
      {selected && (
        <div className="flex flex-wrap gap-2">
          {selected.status === 'connected' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disconnect.isPending}
              onClick={() =>
                disconnect.mutate(selected.id, { onSuccess: () => announce('Carteira desconectada.') })
              }
            >
              <Plug aria-hidden="true" /> Desconectar
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={connect.isPending}
              aria-busy={connect.isPending}
              onClick={() =>
                connect.mutate(selected.id, { onSuccess: () => announce('Carteira conectada.') })
              }
            >
              <PlugZap aria-hidden="true" />{' '}
              {connect.isPending ? 'Aguardando a carteira…' : 'Conectar carteira'}
            </Button>
          )}
        </div>
      )}
      {(error || actionError) && (
        <p id="wallet-error" role="alert" className="text-caption text-danger">
          {error ??
            (isAppError(actionError) ? actionError.message : 'Não foi possível falar com a carteira.')}
        </p>
      )}
    </fieldset>
  )
}
