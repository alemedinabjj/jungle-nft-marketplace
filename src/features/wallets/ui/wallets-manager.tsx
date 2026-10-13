import { Plug, PlugZap, Plus } from 'lucide-react'
import { useState } from 'react'
import { WALLET_PROVIDER_LABELS, type Wallet } from '@/shared/contracts'
import { isAppError } from '@/shared/http'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { useAnnounce } from '@/shared/ui/live-region'
import { shortAddress } from '../model/address'
import { useConnectWallet, useDisconnectWallet } from '../queries/wallets-queries'
import { WalletForm } from './wallet-form'

function ConnectionControls({ wallet }: { wallet: Wallet }) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const announce = useAnnounce()
  const error = connect.error ?? disconnect.error
  const connected = wallet.status === 'connected'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-card px-4 py-3 text-body">
        <span
          className={cn('size-2 rounded-full', connected ? 'bg-success' : 'bg-secondary')}
          aria-hidden="true"
        />
        <span className="flex-1 text-text-primary">
          {WALLET_PROVIDER_LABELS[wallet.provider]} · {shortAddress(wallet.address)} —{' '}
          {connected ? 'conectada' : 'desconectada'}
        </span>
        {connected ? (
          <Button
            size="sm"
            variant="outline"
            disabled={disconnect.isPending}
            onClick={() =>
              disconnect.mutate(wallet.id, { onSuccess: () => announce('Carteira desconectada.') })
            }
          >
            <Plug aria-hidden="true" /> Desconectar
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={connect.isPending}
            aria-busy={connect.isPending}
            onClick={() => connect.mutate(wallet.id, { onSuccess: () => announce('Carteira conectada.') })}
          >
            <PlugZap aria-hidden="true" /> {connect.isPending ? 'Aguardando a carteira…' : 'Conectar'}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-caption text-danger">
          {isAppError(error) ? error.message : 'Não foi possível falar com a carteira.'}
        </p>
      )}
    </div>
  )
}

/** Primary + secondary wallets (Figma "Carteiras"). */
export function WalletsManager({ wallets }: { wallets: Wallet[] }) {
  const primary = wallets.find((wallet) => wallet.slot === 'primary')
  const secondary = wallets.find((wallet) => wallet.slot === 'secondary')
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="primary-title" className="flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h1 id="primary-title" className="text-body-lg font-bold text-text-primary">
            Carteira principal
          </h1>
        </div>
        <p className="text-body text-text-secondary">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
        {primary && <ConnectionControls wallet={primary} />}
        <WalletForm key={primary?.id ?? 'new-primary'} slot="primary" wallet={primary} />
      </section>

      <section aria-labelledby="secondary-title" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <h2 id="secondary-title" className="text-body-lg font-bold text-text-primary">
            Carteira secundária
          </h2>
          {!secondary && !addingSecondary && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddingSecondary(true)}
              disabled={!primary}
              title={primary ? undefined : 'Cadastre a carteira principal primeiro'}
            >
              <Plus aria-hidden="true" /> Adicionar
            </Button>
          )}
        </div>
        {secondary ? (
          <>
            <ConnectionControls wallet={secondary} />
            <WalletForm key={secondary.id} slot="secondary" wallet={secondary} />
          </>
        ) : addingSecondary && primary ? (
          <>
            <label className="flex w-fit cursor-pointer items-center gap-2 text-body text-text-primary">
              <input
                type="checkbox"
                checked={sameAsPrimary}
                onChange={(event) => setSameAsPrimary(event.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              Igual à carteira principal (mesma rede e tipo)
            </label>
            <WalletForm
              key={sameAsPrimary ? 'same' : 'custom'}
              slot="secondary"
              wallet={undefined}
              defaults={
                sameAsPrimary
                  ? { network: primary.network, provider: primary.provider, label: 'Carteira secundária' }
                  : { label: 'Carteira secundária' }
              }
              onSaved={() => setAddingSecondary(false)}
            />
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-border-soft p-5 text-body text-text-secondary">
            {primary
              ? 'Você ainda não adicionou uma carteira secundária.'
              : 'Cadastre a carteira principal para poder adicionar uma secundária.'}
          </p>
        )}
      </section>
    </div>
  )
}
