import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cartSchema, orderSchema, quoteSchema, sessionSchema, type Collector } from '@/shared/contracts'
import { mockControl } from './control'
import { DEMO_PASSWORD } from './fixtures/users'
import { server } from './node'
import { setScenario } from './scenarios/controller'

const BASE = 'http://localhost/api'

async function call(path: string, init: RequestInit & { token?: string; guest?: string } = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`)
  if (init.guest) headers.set('X-Guest-Id', init.guest)
  const response = await fetch(`${BASE}${path}`, { ...init, headers })
  const body: unknown = response.status === 204 ? null : await response.json()
  return { status: response.status, body }
}

async function login(email = 'ana@kurio.dev') {
  const { body } = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: DEMO_PASSWORD }),
  })
  return sessionSchema.parse(body).token
}

const collector: Collector = {
  displayName: 'Ana Ribeiro',
  username: 'ana.ribeiro',
  profileName: 'Ana Coleções',
  email: 'ana@kurio.dev',
  referralCode: 'KURIO-01',
  ensName: 'ana',
  note: '',
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
beforeEach(async () => {
  setScenario('default')
  await mockControl.reset('default')
})

describe('simulated backend', () => {
  it('rejects wrong credentials and conflicting registrations', async () => {
    const bad = await call('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ana@kurio.dev', password: 'wrong-pass1' }),
    })
    expect(bad).toMatchObject({ status: 401, body: { error: { code: 'INVALID_CREDENTIALS' } } })
    const conflict = await call('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Ana', email: 'ANA@kurio.dev', password: 'Senha1234' }),
    })
    expect(conflict).toMatchObject({
      status: 409,
      body: { error: { code: 'EMAIL_TAKEN', fieldErrors: { email: expect.any(String) } } },
    })
  })

  it('merges the guest cart into the user cart on login, clamped to stock', async () => {
    const guest = 'gst_abcdef1234'
    await call('/cart/items', {
      method: 'POST',
      guest,
      body: JSON.stringify({ nftId: 'nft-001', editionId: '1-of-10', quantity: 2 }),
    })
    const token = await login()
    await call('/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify({ nftId: 'nft-001', editionId: '1-of-10', quantity: 2 }),
    })
    const merged = cartSchema.parse((await call('/cart/merge', { method: 'POST', token, guest })).body)
    expect(merged.items).toHaveLength(1)
    expect(merged.items[0]?.quantity).toBe(4)
  })

  it('creates orders idempotently and removes only purchased quantities', async () => {
    const token = await login()
    await call('/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify({ nftId: 'nft-001', editionId: 'open', quantity: 2 }),
    })
    await call('/wallets/wal_ana_primary/connect', { method: 'POST', token })
    const quote = quoteSchema.parse((await call('/cart/quote', { token })).body)
    const payload = {
      quoteFingerprint: quote.fingerprint,
      walletId: 'wal_ana_primary',
      network: 'ethereum',
      alternateAddress: null,
      collector,
    }
    const headers = { 'Idempotency-Key': 'attempt-0000000000000001' }

    const first = await call('/orders', { method: 'POST', token, headers, body: JSON.stringify(payload) })
    const again = await call('/orders', { method: 'POST', token, headers, body: JSON.stringify(payload) })
    expect(first.status).toBe(201)
    expect(again.status).toBe(200)
    expect(orderSchema.parse(again.body).id).toBe(orderSchema.parse(first.body).id)

    const conflict = await call('/orders', {
      method: 'POST',
      token,
      headers,
      body: JSON.stringify({ ...payload, network: 'polygon' }),
    })
    expect(conflict).toMatchObject({ status: 409, body: { error: { code: 'IDEMPOTENCY_CONFLICT' } } })

    // A purchase-time addition must survive settlement.
    await call('/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify({ nftId: 'nft-002', editionId: 'open', quantity: 1 }),
    })
    await new Promise((resolve) => setTimeout(resolve, 1_800))

    const order = orderSchema.parse(
      (await call(`/orders/${orderSchema.parse(first.body).id}`, { token })).body,
    )
    expect(order.status).toBe('confirmed')
    expect(order.total).toBe('2.396')
    const cart = cartSchema.parse((await call('/cart', { token })).body)
    expect(cart.items.map((item) => [item.nftId, item.quantity])).toEqual([['nft-002', 1]])
  })

  it('blocks the order when the quote is stale', async () => {
    const token = await login()
    await call('/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify({ nftId: 'nft-001', editionId: 'open', quantity: 1 }),
    })
    await call('/wallets/wal_ana_primary/connect', { method: 'POST', token })
    const quote = quoteSchema.parse((await call('/cart/quote', { token })).body)
    await mockControl.updateNft('nft-001', { priceDelta: '0.5' })
    const response = await call('/orders', {
      method: 'POST',
      token,
      headers: { 'Idempotency-Key': 'attempt-0000000000000002' },
      body: JSON.stringify({
        quoteFingerprint: quote.fingerprint,
        walletId: 'wal_ana_primary',
        network: 'ethereum',
        alternateAddress: null,
        collector,
      }),
    })
    expect(response).toMatchObject({ status: 409, body: { error: { code: 'QUOTE_CHANGED' } } })
  })

  it('isolates private data between users', async () => {
    const ana = await login('ana@kurio.dev')
    const bruno = await login('bruno@kurio.dev')
    await call('/cart/items', {
      method: 'POST',
      token: ana,
      body: JSON.stringify({ nftId: 'nft-001', editionId: 'open', quantity: 1 }),
    })
    const brunoCart = cartSchema.parse((await call('/cart', { token: bruno })).body)
    expect(brunoCart.items).toEqual([])
    expect((await call('/favorites', { token: bruno })).body).toEqual({ nftIds: [] })
  })
})
