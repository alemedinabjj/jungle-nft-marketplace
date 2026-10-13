import type { RequestHandler, WebSocketHandler } from 'msw'

/** Aggregated REST + Socket.IO handlers. Each feature registers its own module. */
export const handlers: Array<RequestHandler | WebSocketHandler> = []
