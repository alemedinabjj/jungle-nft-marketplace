import {
  cartSchema,
  GUEST_ID_HEADER,
  quoteSchema,
  type AddCartItemRequest,
  type Cart,
  type EditionId,
  type Quote,
} from '@/shared/contracts'
import { http } from '@/shared/http'
import { getGuestId } from '../model/guest-id'

/** Guests are identified by X-Guest-Id; when a token exists the server uses the user's cart. */
const guestHeaders = () => ({ [GUEST_ID_HEADER]: getGuestId() })
const line = (nftId: string, editionId: EditionId) => `/cart/items/${encodeURIComponent(nftId)}/${editionId}`

export const cartApi = {
  async get(signal?: AbortSignal): Promise<Cart> {
    const { data } = await http.get<unknown>('/cart', { headers: guestHeaders(), signal })
    return cartSchema.parse(data)
  },
  async quote(signal?: AbortSignal): Promise<Quote> {
    const { data } = await http.get<unknown>('/cart/quote', { headers: guestHeaders(), signal })
    return quoteSchema.parse(data)
  },
  async add(body: AddCartItemRequest): Promise<Cart> {
    const { data } = await http.post<unknown>('/cart/items', body, { headers: guestHeaders() })
    return cartSchema.parse(data)
  },
  async update(nftId: string, editionId: EditionId, quantity: number): Promise<Cart> {
    const { data } = await http.patch<unknown>(
      line(nftId, editionId),
      { quantity },
      { headers: guestHeaders() },
    )
    return cartSchema.parse(data)
  },
  async remove(nftId: string, editionId: EditionId): Promise<Cart> {
    const { data } = await http.delete<unknown>(line(nftId, editionId), { headers: guestHeaders() })
    return cartSchema.parse(data)
  },
  async applyCoupon(code: string): Promise<Cart> {
    const { data } = await http.post<unknown>('/cart/coupon', { code }, { headers: guestHeaders() })
    return cartSchema.parse(data)
  },
  async removeCoupon(): Promise<Cart> {
    const { data } = await http.delete<unknown>('/cart/coupon', { headers: guestHeaders() })
    return cartSchema.parse(data)
  },
  async mergeGuest(): Promise<Cart> {
    const { data } = await http.post<unknown>('/cart/merge', null, { headers: guestHeaders() })
    return cartSchema.parse(data)
  },
}
