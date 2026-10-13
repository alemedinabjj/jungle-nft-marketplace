import { createContext, useContext } from 'react'
import type { CartPriceNotice } from '../client/apply-event'

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting'

export interface RealtimeContextValue {
  status: RealtimeStatus
  notices: CartPriceNotice[]
  dismissNotice: (id: string) => void
}

export const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'connecting',
  notices: [],
  dismissNotice: () => undefined,
})

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext)
}
