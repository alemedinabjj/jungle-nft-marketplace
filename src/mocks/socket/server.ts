import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { RealtimeEvent } from '@/shared/contracts'
import { REALTIME_EVENT_CHANNEL } from '@/shared/contracts'
import { getDb } from '../db/store'
import { subscribe } from './bus'

/**
 * Simulated Socket.IO server (via @mswjs/socket.io-binding).
 *
 * Binding caveats handled here (see ARCHITECTURE.md):
 * - MSW strips the `/socket.io/` path, so we listen on the origin wildcard.
 * - The binding never sends Engine.IO pings; we send a heartbeat ("2") so the
 *   client doesn't drop the connection after pingInterval + pingTimeout.
 * - Clients authenticate with a `session:join` event; order events are only
 *   delivered to the sockets of the order owner.
 */
const REALTIME_ORIGIN = (import.meta.env.VITE_REALTIME_URL as string | undefined) ?? 'wss://realtime.mock'
export const HEARTBEAT_MS = 20_000

interface ConnectionState {
  id: number
  userId: string | null
  token: string | null
  emit: (event: string, ...data: unknown[]) => void
  close: () => void
}

const connections = new Map<number, ConnectionState>()
let connectionSeq = 0

function deliver(event: RealtimeEvent): void {
  for (const connection of connections.values()) {
    if (event.userId && event.userId !== connection.userId) continue
    connection.emit(REALTIME_EVENT_CHANNEL, event)
  }
}

let unsubscribe: (() => void) | null = null
function ensureSubscribed(): void {
  unsubscribe ??= subscribe(deliver)
}

const realtime = ws.link(`${REALTIME_ORIGIN}/*`)

export const socketHandlers = [
  realtime.addEventListener('connection', (connection) => {
    ensureSubscribed()
    const io = toSocketIo(connection)
    const state: ConnectionState = {
      id: ++connectionSeq,
      userId: null,
      token: null,
      emit: (event, ...data) => io.client.emit(event, ...data),
      close: () => connection.client.close(),
    }
    connections.set(state.id, state)

    const heartbeat = setInterval(() => connection.client.send('2'), HEARTBEAT_MS)

    io.client.on('session:join', (_event, payload: { token?: string } | undefined) => {
      void (async () => {
        const db = await getDb()
        const session = db.sessions.find((candidate) => candidate.token === payload?.token)
        if (!session || Date.parse(session.expiresAt) <= Date.now()) {
          state.userId = null
          state.token = null
          io.client.emit('session:rejected', { reason: 'SESSION_EXPIRED' })
          return
        }
        state.userId = session.userId
        state.token = session.token
        io.client.emit('session:joined', { userId: session.userId })
      })()
    })

    io.client.on('session:leave', () => {
      state.userId = null
      state.token = null
    })

    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      connections.delete(state.id)
    })
  }),
]

/** Drop every socket bound to a session (logout). */
export function disconnectUserSockets(userId: string, token: string): void {
  for (const connection of connections.values()) {
    if (connection.userId === userId && connection.token === token) connection.close()
  }
}

/** Test/dev control: simulate the server dropping all connections. */
export function disconnectAllSockets(): number {
  const count = connections.size
  for (const connection of connections.values()) connection.close()
  return count
}

export function connectedSocketCount(): number {
  return connections.size
}
