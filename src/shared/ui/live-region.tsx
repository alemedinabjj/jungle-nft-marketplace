import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Announce = (message: string, politeness?: 'polite' | 'assertive') => void
const AnnounceContext = createContext<Announce>(() => undefined)

/**
 * Single polite + assertive live region for the app. Mutations and realtime
 * updates announce through it so screen readers hear what changed.
 */
export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')

  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    const set = politeness === 'assertive' ? setAssertive : setPolite
    // Clear first so repeating the same message is announced again.
    set('')
    window.setTimeout(() => set(message), 50)
  }, [])

  const value = useMemo(() => announce, [announce])
  return (
    <AnnounceContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="live-polite">
        {polite}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true" data-testid="live-assertive">
        {assertive}
      </div>
    </AnnounceContext.Provider>
  )
}

export function useAnnounce(): Announce {
  return useContext(AnnounceContext)
}
