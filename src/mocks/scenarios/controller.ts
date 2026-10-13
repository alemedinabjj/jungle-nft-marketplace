import { delay } from 'msw'
import {
  DEFAULT_SESSION_TTL_MS,
  findScenario,
  SCENARIOS,
  type EndpointGroup,
  type FailureKind,
  type ScenarioDefinition,
} from './registry'

const STORAGE_KEY = 'kurio:mock-scenario'

let active: ScenarioDefinition = SCENARIOS[0]
let requestCounter = 0
let outOfOrderCounter = 0
const flakyHits = new Set<string>()

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Resolve the active scenario: explicit id → persisted choice → default. */
export function initScenario(fromUrl: string | null): ScenarioDefinition {
  const chosen = findScenario(fromUrl) ?? findScenario(storage()?.getItem(STORAGE_KEY)) ?? SCENARIOS[0]
  return setScenario(chosen.id)
}

export function setScenario(id: string): ScenarioDefinition {
  const scenario = findScenario(id)
  if (!scenario) throw new Error(`Unknown scenario "${id}"`)
  active = scenario
  requestCounter = 0
  outOfOrderCounter = 0
  flakyHits.clear()
  storage()?.setItem(STORAGE_KEY, scenario.id)
  return scenario
}

export function getScenario(): ScenarioDefinition {
  return active
}

export function sessionTtlMs(): number {
  return active.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS
}

/** Deterministic latency for the current request. */
export async function simulateLatency(group: EndpointGroup): Promise<void> {
  if (group === 'catalog' && active.outOfOrder) {
    // Each new catalog request is faster than the previous one, so earlier
    // (stale) responses land after newer ones.
    outOfOrderCounter += 1
    await delay(Math.max(100, 1600 - outOfOrderCounter * 600))
    return
  }
  const { latency } = active
  const ms = typeof latency === 'number' ? latency : (latency[requestCounter++ % latency.length] ?? 0)
  if (ms > 0) await delay(ms)
}

/** Failure configured for this endpoint group, if any (flaky fails once per key). */
export function failureFor(group: EndpointGroup, key: string): FailureKind | null {
  const failure = active.failures?.[group] ?? null
  if (failure !== 'flaky') return failure
  if (flakyHits.has(key)) return null
  flakyHits.add(key)
  return 'flaky'
}
