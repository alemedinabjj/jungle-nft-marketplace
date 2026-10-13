import { startTransition, useEffect, useState, type ReactNode } from 'react'

const whenIdle = (callback: () => void): (() => void) => {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 1_500 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(callback, 200)
  return () => clearTimeout(id)
}

/**
 * Renders below-the-fold content after the first commit, when the main thread is
 * idle. Keeps the initial commit small (lower TBT) without affecting what the user
 * sees first. Never use it for content that can be in the initial viewport.
 */
export function Deferred({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => whenIdle(() => startTransition(() => setReady(true))), [])
  return ready ? children : null
}
