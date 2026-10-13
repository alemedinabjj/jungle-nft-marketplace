import { z } from 'zod'
import { IDEMPOTENCY_KEY_HEADER, orderSchema, type CreateOrderRequest, type Order } from '@/shared/contracts'
import { http } from '@/shared/http'

export const ordersApi = {
  /** Never retried blindly: the caller retries only with the same Idempotency-Key. */
  async create(body: CreateOrderRequest, idempotencyKey: string): Promise<Order> {
    const { data } = await http.post<unknown>('/orders', body, {
      headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
    })
    return orderSchema.parse(data)
  },
  async get(id: string, signal?: AbortSignal): Promise<Order> {
    const { data } = await http.get<unknown>(`/orders/${encodeURIComponent(id)}`, { signal })
    return orderSchema.parse(data)
  },
  async listPending(signal?: AbortSignal): Promise<Order[]> {
    const { data } = await http.get<unknown>('/orders', { params: { status: 'pending' }, signal })
    return z.array(orderSchema).parse(data)
  },
}
