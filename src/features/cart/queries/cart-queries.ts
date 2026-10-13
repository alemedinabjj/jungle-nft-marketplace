import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { AddCartItemRequest, Cart, EditionId } from '@/shared/contracts'
import { useCurrentUserId } from '@/features/auth'
import { cartApi } from '../api/cart-api'
import { getGuestId } from '../model/guest-id'

/** Cart & quote keys are scoped to the owner: `user:<id>` or `guest:<id>`. */
export const cartKeys = {
  all: ['cart'] as const,
  detail: (owner: string) => [...cartKeys.all, owner, 'detail'] as const,
  quote: (owner: string) => [...cartKeys.all, owner, 'quote'] as const,
}

export function cartOwner(userId: string | null): string {
  return userId ? `user:${userId}` : `guest:${getGuestId()}`
}

export const cartQueryOptions = (owner: string) =>
  queryOptions({
    queryKey: cartKeys.detail(owner),
    queryFn: ({ signal }) => cartApi.get(signal),
    staleTime: 10_000,
  })

export const quoteQueryOptions = (owner: string) =>
  queryOptions({
    queryKey: cartKeys.quote(owner),
    queryFn: ({ signal }) => cartApi.quote(signal),
    staleTime: 0,
  })

export function useCartOwner(): string {
  return cartOwner(useCurrentUserId())
}

export function useCart() {
  return useQuery(cartQueryOptions(useCartOwner()))
}

export function useQuote(enabled = true) {
  return useQuery({ ...quoteQueryOptions(useCartOwner()), enabled })
}

/** Every cart mutation returns the cart; we store it and refresh the quote. */
function useCartMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const owner = useCartOwner()
  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail(owner), cart)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKeys.quote(owner) }),
  })
}

export const useAddToCart = () => useCartMutation((body: AddCartItemRequest) => cartApi.add(body))
export const useUpdateCartItem = () =>
  useCartMutation(
    ({ nftId, editionId, quantity }: { nftId: string; editionId: EditionId; quantity: number }) =>
      cartApi.update(nftId, editionId, quantity),
  )
export const useRemoveCartItem = () =>
  useCartMutation(({ nftId, editionId }: { nftId: string; editionId: EditionId }) =>
    cartApi.remove(nftId, editionId),
  )
export const useApplyCoupon = () => useCartMutation((code: string) => cartApi.applyCoupon(code))
export const useRemoveCoupon = () => useCartMutation(() => cartApi.removeCoupon())

/** After login: merge the guest cart into the user's cart (server clamps to stock). */
export async function mergeGuestCart(queryClient: QueryClient, userId: string): Promise<void> {
  const cart = await cartApi.mergeGuest()
  queryClient.setQueryData(cartKeys.detail(cartOwner(userId)), cart)
  queryClient.removeQueries({ queryKey: cartKeys.detail(`guest:${getGuestId()}`) })
  await queryClient.invalidateQueries({ queryKey: cartKeys.quote(cartOwner(userId)) })
}
