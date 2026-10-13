import { useState } from 'react'
import type { NftDetail } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { NftImage } from '@/shared/ui/nft-image'

/** 4 thumbnails + main artwork (Figma "Product Images", 573×448). */
export function NftGallery({ nft }: { nft: NftDetail }) {
  const [active, setActive] = useState(0)
  const main = nft.gallery[active] ?? nft.image
  return (
    <div className="grid gap-4 md:grid-cols-[100px_1fr] md:gap-7">
      <div
        role="group"
        aria-label="Imagens do NFT"
        className="order-2 flex gap-3 md:order-1 md:flex-col md:gap-4"
      >
        {nft.gallery.map((image, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Ver imagem ${index + 1} de ${nft.gallery.length}`}
            aria-pressed={active === index}
            className={cn(
              'size-16 overflow-hidden rounded-xl border-2 transition-colors md:size-[100px]',
              active === index ? 'border-primary' : 'border-transparent opacity-80 hover:opacity-100',
            )}
          >
            <NftImage image={image} sizes="100px" alt="" className="h-full" />
          </button>
        ))}
      </div>
      <div className="order-1 rounded-lg bg-surface-card p-3 md:order-2 md:p-5">
        <NftImage image={main} sizes="(min-width: 768px) 404px, 92vw" priority className="rounded-3xl" />
      </div>
    </div>
  )
}
