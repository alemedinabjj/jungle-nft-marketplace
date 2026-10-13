import { itemCount } from '../model/cart'
import { useCart } from '../queries/cart-queries'

export function useCartItemCount(): number {
  const cart = useCart()
  return cart.data ? itemCount(cart.data.items) : 0
}
