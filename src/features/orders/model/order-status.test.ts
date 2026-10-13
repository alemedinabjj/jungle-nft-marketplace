import { describe, expect, it } from 'vitest'
import type { Order } from '@/shared/contracts'
import { isTerminal, mergeOrder } from './order-status'

const order = (patch: Partial<Order>): Order => ({
  id: 'ord_1',
  status: 'pending',
  lines: [
    {
      nftId: 'nft-001',
      editionId: 'open',
      name: 'x',
      tokenId: '#1',
      image: { src: '/a', alt: '', width: 1, height: 1 },
      quantity: 1,
      unitPrice: '1',
      lineTotal: '1',
    },
  ],
  subtotal: '1',
  discount: '0',
  networkFee: '0.016',
  total: '1.016',
  couponCode: null,
  network: 'ethereum',
  wallet: { provider: 'metamask', address: '0x' },
  collector: { displayName: 'a', username: 'a', email: 'a@a.dev' },
  transactionId: null,
  rejectionReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
  ...patch,
})

describe('order status', () => {
  it('knows terminal states', () => {
    expect(isTerminal('pending')).toBe(false)
    expect(isTerminal('confirmed')).toBe(true)
    expect(isTerminal('rejected')).toBe(true)
  })

  it('never regresses a terminal order or applies an older version', () => {
    const confirmed = order({ status: 'confirmed', version: 2 })
    expect(mergeOrder(confirmed, order({ status: 'pending', version: 3 }))).toBe(confirmed)
    expect(mergeOrder(confirmed, order({ status: 'confirmed', version: 1 }))).toBe(confirmed)
    const next = order({ status: 'confirmed', version: 2 })
    expect(mergeOrder(order({}), next)).toBe(next)
  })
})
