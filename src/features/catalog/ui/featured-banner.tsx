import { Link } from '@tanstack/react-router'
import { NftImage } from '@/shared/ui/nft-image'
import { Skeleton } from '@/shared/ui/skeleton'
import { useFeatured } from '../queries/catalog-queries'

/** "NFT EM DESTAQUE / OFERTA LIMITADA" banner under the filters. */
export function FeaturedBanner() {
  const featured = useFeatured()
  const nft = featured.data?.spotlight
  return (
    <div className="relative flex flex-col gap-4 rounded-lg pt-6">
      <div className="px-5">
        <p className="text-[18px] leading-8 font-bold text-text-accent">NFT EM DESTAQUE</p>
        <p className="text-body-lg font-bold text-text-primary">OFERTA LIMITADA</p>
      </div>
      {nft ? (
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block overflow-hidden rounded-3xl">
          <NftImage
            image={nft.image}
            sizes="310px"
            className="aspect-[310/368] object-cover"
            alt={`${nft.name} — NFT em destaque`}
          />
        </Link>
      ) : (
        <Skeleton className="aspect-[310/368] w-full rounded-3xl" />
      )}
    </div>
  )
}
