/**
 * Requests wait on this gate before leaving the app. Bootstrap uses it to hold
 * calls until the mock worker is ready, without blocking the first paint.
 * Dependency-free on purpose: main.tsx sets it before the heavy graph loads.
 */
let requestGate: Promise<unknown> = Promise.resolve()

export function setRequestGate(gate: Promise<unknown>): void {
  requestGate = gate
}

/** Resolves once outgoing traffic is allowed (mock worker ready in demo/dev). */
export function whenRequestsReady(): Promise<unknown> {
  return requestGate
}
