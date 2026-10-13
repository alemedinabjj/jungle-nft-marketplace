import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/shared/contracts'
import { NftImage } from '@/shared/ui/nft-image'
import { Skeleton } from '@/shared/ui/skeleton'
import { PriceTag } from './price-tag'

const CARD_SIZES = '(min-width: 1200px) 250px, (min-width: 768px) 30vw, 45vw'

/** Product card (258×356 in Figma): framed artwork, name, price. */
export function NftCard({ nft, priority = false }: { nft: NftSummary; priority?: boolean }) {
  const soldOut = nft.available === 0
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative flex aspect-[258/300] items-center justify-center rounded-lg bg-surface-card p-1 transition-colors group-hover:bg-surface-dark">
        <NftImage image={nft.image} sizes={CARD_SIZES} priority={priority} className="rounded-2xl" alt="" />
        {soldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-ink/90 px-3 py-1 text-caption font-bold text-text-primary">
            Esgotado
          </span>
        )}
      </div>
      <h3 className="truncate text-body font-medium text-text-primary">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-text-accent"
        >
          {nft.name}
        </Link>
      </h3>
      <PriceTag price={nft.price} compareAtPrice={nft.compareAtPrice} className="-mt-1" />
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="aspect-[258/300] w-full rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}
