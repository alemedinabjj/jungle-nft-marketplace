import { createSeedState, DB_SCHEMA_VERSION, type SeedOptions } from './seed'
import type { DbState } from './types'

/**
 * Single source of truth for the simulated backend. REST handlers and the
 * Socket.IO server both read/write here, so every change is visible on both
 * channels. Persisted to localStorage in the browser (memory-only in Node).
 */
const STORAGE_KEY = 'kurio:mock-db'

let state: DbState | null = null
let loading: Promise<DbState> | null = null
let seedOptions: SeedOptions = {}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function readPersisted(): DbState | null {
  const raw = storage()?.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DbState
    return parsed.schemaVersion === DB_SCHEMA_VERSION ? parsed : null
  } catch {
    return null
  }
}

function persist(): void {
  if (state) storage()?.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function configureSeed(options: SeedOptions): void {
  seedOptions = options
}

/** Lazily loads (or seeds) the db on first access — never on the boot path. */
export async function getDb(): Promise<DbState> {
  if (state) return state
  loading ??= (async () => {
    state = readPersisted() ?? (await createSeedState(seedOptions))
    persist()
    return state
  })()
  return loading
}

/** Apply a mutation and persist atomically. */
export async function mutateDb<T>(mutation: (db: DbState) => T): Promise<T> {
  const db = await getDb()
  const result = mutation(db)
  persist()
  return result
}

/** Restore the known seed (optionally for another scenario). */
export async function resetDb(options: SeedOptions = seedOptions): Promise<DbState> {
  seedOptions = options
  state = await createSeedState(options)
  loading = Promise.resolve(state)
  persist()
  return state
}

export function nextEventId(db: DbState): string {
  db.eventSeq += 1
  return `evt_${String(db.eventSeq).padStart(6, '0')}`
}
