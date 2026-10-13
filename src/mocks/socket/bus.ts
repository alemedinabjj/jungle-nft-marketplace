import type { RealtimeEvent } from '@/shared/contracts'

type Listener = (event: RealtimeEvent) => void

/**
 * In-process event bus of the simulated backend. Domain mutations publish
 * here; the Socket.IO handler forwards events to connected clients.
 * Keeps a short log so tests can replay duplicates / stale versions.
 */
const listeners = new Set<Listener>()
const log: RealtimeEvent[] = []

export function publish(event: RealtimeEvent): void {
  log.push(event)
  if (log.length > 200) log.shift()
  listeners.forEach((listener) => listener(event))
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function eventLog(): readonly RealtimeEvent[] {
  return log
}

export function clearEventLog(): void {
  log.length = 0
}
