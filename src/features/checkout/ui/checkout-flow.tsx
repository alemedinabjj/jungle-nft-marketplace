import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  NETWORK_LABELS,
  networkSchema,
  WALLET_PROVIDER_LABELS,
  type Order,
  type Quote,
  type User,
  type Wallet,
} from '@/shared/contracts'
import { useCart, useQuote } from '@/features/cart'
import { canConfirm, describeQuoteChanges, isQuoteStale, QuoteSummary } from '@/features/quote'
import { shortAddress } from '@/features/wallets'
import { isAppError } from '@/shared/http'
import { formatEth, multiplyEth } from '@/shared/money'
import { Button } from '@/shared/ui/button'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'
import { Input } from '@/shared/ui/input'
import { useAnnounce } from '@/shared/ui/live-region'
import { NftImage } from '@/shared/ui/nft-image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import {
  checkoutFormSchema,
  initialCheckoutValues,
  toCreateOrderRequest,
  type CheckoutFormValues,
} from '../model/checkout-form'
import { checkoutStorage } from '../model/checkout-storage'
import { usePlaceOrder } from '../queries/use-place-order'
import { WalletPicker } from './wallet-picker'

interface CheckoutFlowProps {
  user: User
  wallets: Wallet[]
  onPlaced: (order: Order) => void
}

function OrderItems() {
  const cart = useCart()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between border-b border-border pb-2 text-body font-bold text-text-primary">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul className="flex flex-col gap-2" aria-label="NFTs do pedido">
        {cart.data?.items.map((item) => (
          <li
            key={`${item.nftId}:${item.editionId}`}
            className="flex items-center gap-3 rounded-md bg-surface-card p-1 pr-3"
          >
            <NftImage image={item.image} sizes="48px" alt="" className="size-12 rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-bold text-text-primary">{item.name}</p>
              <p className="text-caption text-text-secondary">ID do token: {item.tokenId}</p>
            </div>
            <span className="text-caption text-text-secondary">(x {item.quantity})</span>
            <span className="text-body font-bold text-text-accent">
              {formatEth(multiplyEth(item.unitPrice, item.quantity))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Two steps: (1) collector data + wallet/network, (2) review against a freshly
 * revalidated quote. Confirmation is only possible while the reviewed quote is
 * still current — any price/stock/fee change requires the user to re-confirm.
 */
export function CheckoutFlow({ user, wallets, onPlaced }: CheckoutFlowProps) {
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [reviewed, setReviewed] = useState<Quote | null>(null)
  const quote = useQuote()
  const cart = useCart()
  const announce = useAnnounce()
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const { state, placeOrder, retry, reset } = usePlaceOrder({ onPlaced })

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: initialCheckoutValues(user, wallets, checkoutStorage.readDraft(user.id)),
    mode: 'onTouched',
  })
  const { errors } = form.formState

  const values = useWatch({ control: form.control }) as CheckoutFormValues

  // Autosave the draft so an expired session can resume where it stopped.
  useEffect(() => {
    checkoutStorage.writeDraft(user.id, values)
  }, [values, user.id])

  useEffect(() => {
    if (step === 'review') reviewHeading.current?.focus()
  }, [step])

  const wallet = wallets.find((candidate) => candidate.id === values.walletId)
  const current = quote.data
  const names = Object.fromEntries((cart.data?.items ?? []).map((item) => [item.nftId, item.name]))
  let stale = false
  let changes: string[] = []
  if (current && reviewed && isQuoteStale(reviewed, current)) {
    stale = true
    changes = describeQuoteChanges(reviewed, current, names)
  }
  const submitting = state.status === 'submitting'
  const walletReady = wallet?.status === 'connected'
  const confirmable = Boolean(
    current && reviewed && !stale && canConfirm(current) && walletReady && !quote.isFetching,
  )

  // Announce realtime invalidation of the reviewed quote.
  useEffect(() => {
    if (stale) announce('Os valores do pedido mudaram. Revise e confirme novamente.', 'assertive')
  }, [stale, announce])

  const goToReview = form.handleSubmit(async () => {
    reset()
    const fresh = await quote.refetch()
    if (fresh.data) {
      setReviewed(fresh.data)
      setStep('review')
    }
  })

  const confirm = () => {
    if (!reviewed || !confirmable) return
    void placeOrder(toCreateOrderRequest(form.getValues(), reviewed.fingerprint))
  }

  const errorMessage =
    state.status === 'rejected' || state.status === 'uncertain' ? state.error.message : null

  if (submitting && state.recovering) {
    return (
      <FormAlert tone="info" className="mx-auto max-w-xl">
        Recuperando sua tentativa de compra anterior… Nenhum pedido novo será criado.
      </FormAlert>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,553px)_minmax(0,293px)] lg:justify-between">
      {step === 'form' ? (
        <form
          noValidate
          onSubmit={(event) => void goToReview(event)}
          className="flex flex-col gap-5"
          aria-labelledby="collector-title"
        >
          <h2 id="collector-title" className="text-body-lg font-bold text-text-primary">
            Perfil do colecionador
          </h2>
          <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
            <FormField label="Nome de exibição" required error={errors.collector?.displayName?.message}>
              {(control) => (
                <Input {...control} {...form.register('collector.displayName')} autoComplete="name" />
              )}
            </FormField>
            <FormField label="Nome de usuário" required error={errors.collector?.username?.message}>
              {(control) => (
                <Input {...control} {...form.register('collector.username')} autoComplete="username" />
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
            <FormField label="Nome do perfil" required error={errors.collector?.profileName?.message}>
              {(control) => <Input {...control} {...form.register('collector.profileName')} />}
            </FormField>
            <FormField label="E-mail" required error={errors.collector?.email?.message}>
              {(control) => (
                <Input {...control} {...form.register('collector.email')} type="email" autoComplete="email" />
              )}
            </FormField>
            <FormField
              label="Código de indicação"
              required
              error={errors.collector?.referralCode?.message}
              hint="Ex.: KURIO-01"
            >
              {(control) => (
                <Input {...control} {...form.register('collector.referralCode')} autoComplete="off" />
              )}
            </FormField>
            <FormField label="Nome ENS" required error={errors.collector?.ensName?.message}>
              {(control) => (
                <div className="flex">
                  <Input
                    {...control}
                    {...form.register('collector.ensName')}
                    className="rounded-r-none"
                    autoComplete="off"
                  />
                  <span className="flex h-10 items-center rounded-r-md border border-l-0 border-border px-3 text-body text-text-secondary">
                    .eth
                  </span>
                </div>
              )}
            </FormField>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex w-fit cursor-pointer items-center gap-2 text-body text-text-primary">
              <input
                type="checkbox"
                {...form.register('useAlternateAddress')}
                className="size-4 accent-[var(--color-primary)]"
              />
              Usar outra carteira?
            </label>
            {values.useAlternateAddress && (
              <FormField label="Endereço de recebimento" required error={errors.alternateAddress?.message}>
                {(control) => (
                  <Input
                    {...control}
                    {...form.register('alternateAddress')}
                    placeholder="Endereço 0x da carteira"
                    autoComplete="off"
                  />
                )}
              </FormField>
            )}
          </div>

          <FormField label="Observação do colecionador (opcional)" error={errors.collector?.note?.message}>
            {(control) => (
              <textarea
                {...control}
                {...form.register('collector.note')}
                rows={5}
                className="w-full max-w-[253px] rounded-md border border-border bg-ink p-3 text-body text-text-primary md:max-w-none"
              />
            )}
          </FormField>

          <Controller
            control={form.control}
            name="walletId"
            render={({ field }) => (
              <WalletPicker
                wallets={wallets}
                value={field.value}
                onChange={field.onChange}
                error={errors.walletId?.message}
              />
            )}
          />

          <Button type="submit" disabled={quote.isFetching || !cart.data?.items.length} className="h-12">
            Revisar pedido
          </Button>
        </form>
      ) : (
        <section aria-labelledby="review-title" className="flex flex-col gap-6">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="flex w-fit items-center gap-1 text-body text-text-accent hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Editar dados
          </button>
          <h2
            id="review-title"
            ref={reviewHeading}
            tabIndex={-1}
            className="text-body-lg font-bold text-text-primary outline-none"
          >
            Revise seu pedido
          </h2>
          <dl className="grid gap-4 rounded-lg bg-surface-card p-5 text-body sm:grid-cols-2">
            <div>
              <dt className="text-caption text-text-secondary">Colecionador</dt>
              <dd className="text-text-primary">
                {values.collector.displayName} (@{values.collector.username})
              </dd>
            </div>
            <div>
              <dt className="text-caption text-text-secondary">E-mail</dt>
              <dd className="text-text-primary">{values.collector.email}</dd>
            </div>
            <div>
              <dt className="text-caption text-text-secondary">Rede</dt>
              <dd className="text-text-primary">{NETWORK_LABELS[values.network]}</dd>
            </div>
            <div>
              <dt className="text-caption text-text-secondary">Carteira</dt>
              <dd className="text-text-primary">
                {wallet
                  ? `${WALLET_PROVIDER_LABELS[wallet.provider]} · ${shortAddress(values.useAlternateAddress ? values.alternateAddress : wallet.address)}`
                  : '—'}
              </dd>
            </div>
          </dl>
          <WalletPicker
            wallets={wallets}
            value={values.walletId}
            onChange={(id) => form.setValue('walletId', id)}
          />
          {!walletReady && (
            <FormAlert tone="info">Conecte a carteira selecionada para confirmar a compra.</FormAlert>
          )}
        </section>
      )}

      <aside aria-labelledby="order-summary-title" className="flex flex-col gap-5 self-start">
        <h2 id="order-summary-title" className="text-body-lg font-bold text-text-primary">
          Seus NFTs
        </h2>
        <OrderItems />
        <Link to="/cart" className="text-center text-body text-text-primary hover:text-text-accent">
          Tem um código promocional? Aplique aqui
        </Link>
        <QuoteSummary
          quote={step === 'review' && reviewed ? reviewed : current}
          updating={quote.isFetching}
        />

        {stale && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-lg border border-text-accent/60 bg-text-accent/10 p-4 text-body"
          >
            <p className="flex items-center gap-2 font-bold text-text-primary">
              <AlertTriangle aria-hidden="true" className="size-4 text-text-accent" />
              Os valores mudaram desde a sua revisão
            </p>
            <ul className="list-disc pl-5 text-caption text-text-secondary">
              {changes.length > 0 ? (
                changes.map((change) => <li key={change}>{change}</li>)
              ) : (
                <li>A cotação foi atualizada.</li>
              )}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setReviewed(current ?? null)}
              disabled={quote.isFetching}
            >
              Revisar novos valores
            </Button>
          </div>
        )}

        {current && current.issues.length > 0 && (
          <FormAlert>
            {current.issues.map((issue) => issue.message).join(' ')}{' '}
            <Link to="/cart" className="font-bold text-text-accent underline">
              Ajustar carrinho
            </Link>
          </FormAlert>
        )}

        {errorMessage && (
          <FormAlert>
            {errorMessage}
            {state.status === 'uncertain' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 flex"
                onClick={() => void retry()}
              >
                Tentar novamente (sem cobrança duplicada)
              </Button>
            )}
          </FormAlert>
        )}

        {step === 'review' && (
          <Button
            type="button"
            className="h-12"
            onClick={confirm}
            disabled={!confirmable || submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Confirmando…' : 'Confirmar compra'}
          </Button>
        )}
        {quote.isError && !current && (
          <FormAlert>
            {isAppError(quote.error) ? quote.error.message : 'Não foi possível calcular os valores.'}
          </FormAlert>
        )}
      </aside>
    </div>
  )
}
