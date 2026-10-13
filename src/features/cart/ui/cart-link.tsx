import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { useCartItemCount } from './use-cart-item-count'

/** Header cart icon with live item count. */
export function CartLink() {
  const count = useCartItemCount()
  return (
    <Link
      to="/cart"
      aria-label={count > 0 ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho vazio'}
      className="relative hidden size-9 items-center justify-center rounded-full text-text-primary hover:bg-surface-card md:flex"
    >
      <ShoppingCart aria-hidden="true" className="size-5" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-tiny font-bold text-ink"
        >
          {count}
        </span>
      )}
    </Link>
  )
}
