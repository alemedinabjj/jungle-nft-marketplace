import { useNavigate } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import type { EditionId, NftDetail } from '@/shared/contracts'
import { useAddToCart, useCart } from '@/features/cart'
import { isAppError } from '@/shared/http'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { FormAlert } from '@/shared/ui/form-alert'
import { useAnnounce } from '@/shared/ui/live-region'
import { QuantityStepper } from '@/shared/ui/quantity-stepper'
import { defaultEdition, remainingForEdition } from '../model/edition'

/** Edition chips + quantity + "Comprar" (adds to the cart via the API, then opens it). */
export function PurchasePanel({ nft, favoriteSlot }: { nft: NftDetail; favoriteSlot?: ReactNode }) {
  const [editionId, setEditionId] = useState<EditionId>(() => defaultEdition(nft.editions))
  const [requestedQuantity, setQuantity] = useState(1)
  const cart = useCart()
  const add = useAddToCart()
  const navigate = useNavigate()
  const announce = useAnnounce()

  const edition = nft.editions.find((candidate) => candidate.id === editionId) ?? nft.editions[0]
  const inCart =
    cart.data?.items.find((item) => item.nftId === nft.id && item.editionId === editionId)?.quantity ?? 0
  const remaining = edition ? remainingForEdition(edition, inCart) : 0
  const soldOut = !edition || edition.available === 0
  // Derived (not synced via effect): the selection always stays within current stock.
  const quantity = Math.max(1, Math.min(requestedQuantity, Math.max(1, remaining)))

  const buy = async () => {
    try {
      await add.mutateAsync({ nftId: nft.id, editionId, quantity })
      announce(`${quantity} × ${nft.name} (${edition?.label ?? ''}) adicionado ao carrinho.`)
      await navigate({ to: '/cart' })
    } catch {
      // Error is rendered below from add.error
    }
  }

  const errorMessage = add.error
    ? isAppError(add.error)
      ? add.error.message
      : 'Não foi possível adicionar ao carrinho.'
    : null

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-body font-bold text-text-primary">Edição:</legend>
        <div className="flex flex-wrap gap-2">
          {nft.editions.map((option) => {
            const selected = option.id === editionId
            const unavailable = option.available === 0
            return (
              <label
                key={option.id}
                className={cn(
                  'cursor-pointer rounded-full border px-3 py-1 text-caption transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  selected
                    ? 'border-primary text-text-primary'
                    : 'border-border-soft text-text-secondary hover:border-secondary',
                  unavailable && 'cursor-not-allowed line-through opacity-50',
                )}
              >
                <input
                  type="radio"
                  name="edition"
                  value={option.id}
                  className="sr-only"
                  checked={selected}
                  disabled={unavailable}
                  onChange={() => setEditionId(option.id)}
                />
                {option.label === 'Aberta' ? 'ABERTA' : option.label}
                {unavailable && <span className="sr-only"> (esgotada)</span>}
              </label>
            )
          })}
        </div>
        <p className="mt-2 text-caption text-text-secondary" aria-live="polite">
          {!edition || soldOut
            ? 'Esta edição está esgotada.'
            : `${edition.available} disponível(is) · até ${edition.maxPerOrder} por pedido${inCart > 0 ? ` · ${inCart} no carrinho` : ''}`}
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <QuantityStepper
          value={quantity}
          max={Math.max(1, remaining)}
          onChange={setQuantity}
          label="Quantidade"
          disabled={soldOut || remaining === 0}
        />
        <div className="flex gap-3">
          <Button
            onClick={() => void buy()}
            disabled={soldOut || remaining === 0 || add.isPending}
            aria-busy={add.isPending}
            className="w-[140px] uppercase"
          >
            {add.isPending ? 'Adicionando…' : 'Comprar'}
          </Button>
          {favoriteSlot}
        </div>
      </div>
      {remaining === 0 && !soldOut && (
        <p className="text-caption text-text-secondary">
          Você já tem o máximo permitido desta edição no carrinho.
        </p>
      )}
      {errorMessage && <FormAlert>{errorMessage}</FormAlert>}
    </div>
  )
}
