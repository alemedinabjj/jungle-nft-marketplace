import { TERMINAL_ORDER_STATUSES } from '@/shared/contracts'
import { getDb, mutateDb } from '../../db/store'
import type { DbState, OrderRecord } from '../../db/types'
import { stableHash } from '../../lib/crypto'
import { getScenario } from '../../scenarios/controller'
import { emitNftUpdated, emitOrderUpdated } from '../../socket/events'
import { findEdition } from '../cart/pricing'

/** Simulated settlement time between "pending" and a terminal state. */
export const SETTLEMENT_MS = 1_500

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function settle(db: DbState, order: OrderRecord): void {
  if (TERMINAL_ORDER_STATUSES.includes(order.status)) return
  const now = new Date().toISOString()

  const rejectedByScenario = getScenario().checkout === 'payment-rejected'
  const outOfStock = order.purchased.some((line) => {
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId)
    const edition = nft && findEdition(nft, line.editionId)
    return !edition || edition.available < line.quantity
  })

  if (rejectedByScenario || outOfStock) {
    order.status = 'rejected'
    order.rejectionReason = rejectedByScenario
      ? 'Pagamento recusado pela carteira. Nenhum valor foi cobrado.'
      : 'Uma das edições esgotou antes da confirmação. Nenhum valor foi cobrado.'
  } else {
    order.status = 'confirmed'
    order.transactionId = `0x${stableHash({ id: order.id, at: order.createdAt }).padEnd(12, '0')}${order.id.slice(-8)}`
    const touched = new Set<string>()
    for (const line of order.purchased) {
      const nft = db.nfts.find((candidate) => candidate.id === line.nftId)!
      findEdition(nft, line.editionId)!.available -= line.quantity
      touched.add(nft.id)
    }
    // Remove ONLY the purchased quantities from the owner's cart.
    const cart = db.carts.find((candidate) => candidate.ownerKey === `user:${order.userId}`)
    if (cart) {
      cart.items = cart.items.flatMap((item) => {
        const bought = order.purchased.find(
          (line) => line.nftId === item.nftId && line.editionId === item.editionId,
        )
        const remaining = item.quantity - (bought?.quantity ?? 0)
        return remaining > 0 ? [{ ...item, quantity: remaining }] : []
      })
      if (cart.items.length === 0) cart.couponCode = null
      cart.version += 1
      cart.updatedAt = now
    }
    touched.forEach((id) =>
      emitNftUpdated(
        db,
        db.nfts.find((nft) => nft.id === id)!,
      ),
    )
  }
  order.version += 1
  order.updatedAt = now
  emitOrderUpdated(db, order)
}

export function scheduleSettlement(orderId: string, delayMs = SETTLEMENT_MS): void {
  if (timers.has(orderId)) return
  timers.set(
    orderId,
    setTimeout(() => {
      timers.delete(orderId)
      void mutateDb((db) => {
        const order = db.orders.find((candidate) => candidate.id === orderId)
        if (order) settle(db, order)
      })
    }, delayMs),
  )
}

/**
 * After a page refresh the in-memory timers are gone. Pending orders are
 * resumed: settled immediately if overdue, otherwise re-scheduled.
 */
export async function resumePendingOrders(): Promise<void> {
  const db = await getDb()
  for (const order of db.orders) {
    if (order.status !== 'pending') continue
    const elapsed = Date.now() - Date.parse(order.createdAt)
    scheduleSettlement(order.id, Math.max(0, SETTLEMENT_MS - elapsed))
  }
}

export function clearSettlementTimers(): void {
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
}
