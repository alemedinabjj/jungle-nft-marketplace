import { Mail, Share2, Star } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NETWORK_LABELS, type NftDetail } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEth } from '@/shared/money'
import { NftGallery } from './nft-gallery'
import { PurchasePanel } from './purchase-panel'

function Rating({ value, count }: { value: number; count: number }) {
  return (
    <p className="flex items-center gap-1 text-body text-text-primary">
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'size-3.5',
              i < Math.round(value) ? 'fill-text-accent text-text-accent' : 'text-secondary',
            )}
          />
        ))}
      </span>
      <span>
        <span className="sr-only">Nota {value.toFixed(1)} de 5, </span>
        {count} avaliações de colecionadores
      </span>
    </p>
  )
}

export function NftDetailView({ nft, favoriteSlot }: { nft: NftDetail; favoriteSlot?: ReactNode }) {
  const [tab, setTab] = useState<'details' | 'reviews'>('details')
  return (
    <div className="flex flex-col gap-16">
      <div className="grid gap-8 lg:grid-cols-[573px_1fr] lg:gap-7">
        <NftGallery nft={nft} />
        <div className="flex flex-col gap-4">
          <h1 className="text-heading font-bold text-text-primary">{nft.name}</h1>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <p className="text-heading font-bold text-text-accent" aria-live="polite">
              <span className="sr-only">Preço atual: </span>
              {formatEth(nft.price)}
            </p>
            <Rating value={nft.rating} count={nft.reviewCount} />
          </div>
          <div>
            <h2 className="text-body font-bold text-text-primary">Sobre este NFT:</h2>
            <p className="mt-2 text-caption leading-5 text-text-secondary">{nft.description}</p>
          </div>
          <PurchasePanel key={nft.id} nft={nft} favoriteSlot={favoriteSlot} />
          <dl className="flex flex-col gap-2 text-caption text-text-secondary">
            <div className="flex gap-1">
              <dt>ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Coleção:</dt>
              <dd>{nft.collectionName}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Atributos:</dt>
              <dd>{nft.attributes.map((attribute) => attribute.value).join(', ')}</dd>
            </div>
          </dl>
          <div className="flex items-center gap-3 text-body font-bold text-text-primary">
            Compartilhar este NFT:
            <a
              href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(typeof location === 'undefined' ? '' : location.href)}`}
              aria-label="Compartilhar por e-mail"
              className="text-text-primary hover:text-text-accent"
            >
              <Mail aria-hidden="true" className="size-4" />
            </a>
            <button
              type="button"
              aria-label="Copiar link do NFT"
              className="text-text-primary hover:text-text-accent"
              onClick={() => void navigator.clipboard.writeText(location.href)}
            >
              <Share2 aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <section aria-label="Informações do NFT">
        <div role="tablist" aria-label="Seções" className="flex gap-8 border-b border-border">
          {(
            [
              ['details', 'Detalhes do NFT'],
              ['reviews', `Avaliações de colecionadores (${nft.reviewCount})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              id={`tab-${value}`}
              aria-selected={tab === value}
              aria-controls={`panel-${value}`}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => setTab(value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
                  setTab(tab === 'details' ? 'reviews' : 'details')
              }}
              className={cn(
                'relative pb-3 text-body-lg',
                tab === value
                  ? 'font-bold text-text-accent after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary'
                  : 'text-text-primary',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          className="pt-4 text-caption leading-5 text-text-secondary"
        >
          {tab === 'details' ? (
            <div className="flex flex-col gap-5">
              {nft.longDescription.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <div>
                <h3 className="font-bold text-text-primary">Rede:</h3>
                <p>
                  Cunhado na {NETWORK_LABELS[nft.network]} com procedência imutável e metadados armazenados no
                  IPFS.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Contrato:</h3>
                <p>
                  Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos
                  automaticamente pelos mercados compatíveis.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Direitos autorais:</h3>
                <p>
                  {nft.contractAddress.slice(0, 6)}…{nft.contractAddress.slice(-4)} • Contrato inteligente{' '}
                  {nft.contractStandard} verificado.
                </p>
              </div>
            </div>
          ) : (
            <p>As avaliações de colecionadores não estão disponíveis nesta demonstração.</p>
          )}
        </div>
      </section>
    </div>
  )
}
