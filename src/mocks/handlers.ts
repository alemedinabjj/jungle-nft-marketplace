import type { RequestHandler, WebSocketHandler } from 'msw'
import { authHandlers } from './features/auth/handlers'
import { cartHandlers } from './features/cart/handlers'
import { catalogHandlers } from './features/catalog/handlers'
import { favoritesHandlers } from './features/favorites/handlers'
import { orderHandlers } from './features/orders/handlers'
import { profileHandlers } from './features/profile/handlers'
import { walletHandlers } from './features/wallets/handlers'
import { socketHandlers } from './socket/server'

/** Aggregated REST + Socket.IO handlers — identical in dev, demo deploy and tests. */
export const handlers: (RequestHandler | WebSocketHandler)[] = [
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...socketHandlers,
]
