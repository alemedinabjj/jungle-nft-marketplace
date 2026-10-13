import { addEth } from '@/shared/money'
import { getDb, mutateDb, resetDb } from './db/store'
import { findEdition } from './features/cart/pricing'
import { resetCheckoutDisruptions } from './features/orders/handlers'
import { clearSettlementTimers, resumePendingOrders } from './features/orders/process'
import { getScenario, initScenario, setScenario } from './scenarios/controller'
import { SCENARIOS } from './scenarios/registry'
import { clearEventLog, eventLog, publish } from './socket/bus'
import { emitNftUpdated } from './socket/events'
import { connectedSocketCount, disconnectAllSockets } from './socket/server'

/**
 * Control surface of the simulated backend, used by the dev panel and by
 * Playwright. It acts on the *server side* (db + socket server) — events still
 * reach the app through socket.io-client, never through UI setters.
 */
export const mockControl = {
  scenarios: SCENARIOS,
  getScenario: () => getScenario().id,

  async reset(scenarioId?: string) {
    clearSettlementTimers()
    resetCheckoutDisruptions()
    clearEventLog()
    const scenario = scenarioId ? setScenario(scenarioId) : getScenario()
    await resetDb({ emptyCatalog: 'emptyCatalog' in scenario && scenario.emptyCatalog })
  },

  async setScenario(id: string) {
    const previous = getScenario()
    const next = setScenario(id)
    const catalogChanged =
      ('emptyCatalog' in previous && previous.emptyCatalog) !== ('emptyCatalog' in next && next.emptyCatalog)
    if (catalogChanged) await mockControl.reset()
  },

  /** Server-side price/availability change → nft.updated over Socket.IO. */
  async updateNft(
    nftId: string,
    patch: { price?: string; priceDelta?: string; editionAvailable?: Record<string, number> },
  ) {
    return mutateDb((db) => {
      const nft = db.nfts.find((candidate) => candidate.id === nftId)
      if (!nft) throw new Error(`NFT ${nftId} not found`)
      if (patch.price) nft.price = patch.price
      if (patch.priceDelta) nft.price = addEth(nft.price, patch.priceDelta)
      for (const [editionId, available] of Object.entries(patch.editionAvailable ?? {})) {
        const edition = findEdition(nft, editionId as Parameters<typeof findEdition>[1])
        if (edition) edition.available = available
      }
      return emitNftUpdated(db, nft)
    })
  },

  /** Re-deliver a previously emitted event (duplicate eventId). */
  replayEvent(eventId: string) {
    const event = eventLog().find((candidate) => candidate.eventId === eventId)
    if (!event) throw new Error(`Event ${eventId} not in log`)
    publish(event)
  },

  /** Deliver an event with a fresh id but an old version (stale). */
  async replayAsStale(eventId: string) {
    const event = eventLog().find((candidate) => candidate.eventId === eventId)
    if (!event) throw new Error(`Event ${eventId} not in log`)
    const db = await getDb()
    db.eventSeq += 1
    publish({ ...event, eventId: `evt_stale_${db.eventSeq}` })
  },

  events: () => [...eventLog()],
  disconnectSockets: () => disconnectAllSockets(),
  socketCount: () => connectedSocketCount(),
}

export type MockControl = typeof mockControl

/** Read `?scenario=` / `?mock-reset` once at boot. */
export async function bootstrapMocks(url: URL): Promise<void> {
  const scenario = initScenario(url.searchParams.get('scenario'))
  if (url.searchParams.has('mock-reset')) await mockControl.reset(scenario.id)
  await resumePendingOrders()
}
