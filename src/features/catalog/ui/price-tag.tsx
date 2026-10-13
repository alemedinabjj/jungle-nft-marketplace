import type { EthAmount } from '@/shared/money'
import { formatEth } from '@/shared/money'
import { cn } from '@/shared/lib/cn'

export function PriceTag({
  price,
  compareAtPrice,
  className,
}: {
  price: EthAmount
  compareAtPrice?: EthAmount | null
  className?: string
}) {
  return (
    <p className={cn('flex items-baseline gap-3 text-body font-bold text-text-accent', className)}>
      <span>
        <span className="sr-only">Preço: </span>
        {formatEth(price)}
      </span>
      {compareAtPrice && (
        <s className="font-normal text-secondary">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(compareAtPrice)}
        </s>
      )}
    </p>
  )
}
