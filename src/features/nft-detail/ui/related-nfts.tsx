import type { NftSummary } from '@/shared/contracts'
import type { ReactNode } from 'react'

/** "Mais desta coleção" row; cards are rendered by the caller (catalog's NftCard). */
export function RelatedNfts({
  title,
  items,
  renderItem,
}: {
  title: string
  items: NftSummary[] | undefined
  renderItem: (nft: NftSummary) => ReactNode
}) {
  if (items && items.length === 0) return null
  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-6">
      <h2 id="related-title" className="border-b border-border pb-3 text-body-lg font-bold text-text-accent">
        {title}
      </h2>
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-5">
        {items?.map((nft) => (
          <li key={nft.id} className="w-[45vw] shrink-0 snap-start md:w-auto">
            {renderItem(nft)}
          </li>
        ))}
      </ul>
    </section>
  )
}
