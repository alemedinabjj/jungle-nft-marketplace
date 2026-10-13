import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CreateOrderRequest, Order } from '@/shared/contracts'
import { useCurrentUserId } from '@/features/auth'
import { cartKeys } from '@/features/cart'
import { orderKeys, ordersApi } from '@/features/orders'
import { isAppError, type AppError } from '@/shared/http'
import { checkoutStorage } from '../model/checkout-storage'
import { attemptFor, type PurchaseAttempt } from '../model/idempotency'

export type PlaceOrderState =
  | { status: 'idle' }
  | { status: 'submitting'; recovering: boolean }
  | { status: 'uncertain'; error: AppError } // timeout / network: the order may exist
  | { status: 'rejected'; error: AppError } // business error (stale quote, stock, wallet…)

const AUTO_RETRY_DELAY_MS = 1_500

/**
 * Idempotent order placement.
 * - one Idempotency-Key per attempt (same payload → same key);
 * - the in-flight attempt is persisted so a refresh / timeout re-sends the SAME
 *   key and gets the SAME order back instead of creating a second purchase;
 * - transient failures retry once automatically, then let the user retry;
 * - business conflicts (409/422) surface for re-review, never auto-retried.
 */
export function usePlaceOrder({ onPlaced }: { onPlaced: (order: Order) => void }) {
  const userId = useCurrentUserId()
  const queryClient = useQueryClient()
  const [state, setState] = useState<PlaceOrderState>({ status: 'idle' })
  const inFlight = useRef(false)
  const attemptRef = useRef<PurchaseAttempt | null>(null)
  const onPlacedRef = useRef(onPlaced)
  useEffect(() => {
    onPlacedRef.current = onPlaced
  }, [onPlaced])

  const send = useCallback(
    async (payload: CreateOrderRequest, attempt: PurchaseAttempt, recovering: boolean): Promise<void> => {
      if (!userId || inFlight.current) return
      inFlight.current = true
      setState({ status: 'submitting', recovering })
      checkoutStorage.writeInFlight(userId, { attempt, payload })
      try {
        let order: Order
        try {
          order = await ordersApi.create(payload, attempt.key)
        } catch (error) {
          if (!isAppError(error) || error.kind !== 'transient') throw error
          // The request may have reached the server: retry with the SAME key.
          await new Promise((resolve) => setTimeout(resolve, AUTO_RETRY_DELAY_MS))
          order = await ordersApi.create(payload, attempt.key)
        }
        checkoutStorage.clearInFlight(userId)
        checkoutStorage.clearDraft(userId)
        attemptRef.current = null
        queryClient.setQueryData(orderKeys.detail(userId, order.id), order)
        void queryClient.invalidateQueries({ queryKey: cartKeys.all })
        setState({ status: 'idle' })
        onPlacedRef.current(order)
      } catch (error) {
        const appError = isAppError(error) ? error : null
        if (appError?.kind === 'transient') {
          setState({ status: 'uncertain', error: appError })
        } else {
          // Rejected by business rules: this attempt is over.
          checkoutStorage.clearInFlight(userId)
          attemptRef.current = null
          if (appError?.kind !== 'unauthorized') {
            setState({ status: 'rejected', error: appError ?? (error as AppError) })
          } else {
            setState({ status: 'idle' })
          }
          if (appError?.code === 'QUOTE_CHANGED' || appError?.code === 'INSUFFICIENT_STOCK') {
            void queryClient.invalidateQueries({ queryKey: cartKeys.all })
          }
        }
      } finally {
        inFlight.current = false
      }
    },
    [queryClient, userId],
  )

  /** Submit (or re-submit) a payload. Identical payloads reuse the same key. */
  const placeOrder = useCallback(
    (payload: CreateOrderRequest) => {
      attemptRef.current = attemptFor(attemptRef.current, payload)
      return send(payload, attemptRef.current, false)
    },
    [send],
  )

  /** Retry the uncertain attempt with the exact same key and payload. */
  const retry = useCallback(() => {
    if (!userId) return Promise.resolve()
    const stored = checkoutStorage.readInFlight(userId)
    if (!stored) return Promise.resolve()
    attemptRef.current = stored.attempt
    return send(stored.payload, stored.attempt, true)
  }, [send, userId])

  // After a refresh mid-purchase, recover the same order (never create another).
  useEffect(() => {
    if (!userId) return
    const stored = checkoutStorage.readInFlight(userId)
    if (!stored) return
    attemptRef.current = stored.attempt
    // Deferred so the recovery runs outside the effect body (and once under StrictMode).
    const timer = setTimeout(() => void send(stored.payload, stored.attempt, true), 0)
    return () => clearTimeout(timer)
  }, [send, userId])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, placeOrder, retry, reset }
}
