import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import { REALTIME_EVENT_CHANNEL, realtimeEventSchema } from '@/shared/contracts'
import { currentToken, useCurrentUserId } from '@/features/auth'
import { cartKeys } from '@/features/cart'
import { catalogKeys } from '@/features/catalog'
import { orderKeys } from '@/features/orders'
import { env } from '@/shared/config/env'
import { whenRequestsReady } from '@/shared/http'
import { formatEth } from '@/shared/money'
import { useAnnounce } from '@/shared/ui/live-region'
import { applyNftUpdated, applyOrderUpdated, type CartPriceNotice } from '../client/apply-event'
import { createEventLedger, reduceEvent } from '../model/event-reducer'
import { RealtimeContext, type RealtimeStatus } from './realtime-context'

/**
 * One Socket.IO connection per user session. The socket is created only after
 * the mock worker is ready (the binding patches WebSocket) and via dynamic
 * import, so it never weighs on the first paint. Switching user tears the
 * socket and its listeners down and starts a fresh one with a fresh ledger.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  const announce = useAnnounce()
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const [notices, setNotices] = useState<CartPriceNotice[]>([])
  const announceRef = useRef(announce)
  useEffect(() => {
    announceRef.current = announce
  }, [announce])

  useEffect(() => {
    let socket: Socket | null = null
    const lifecycle = { cancelled: false }
    let ledger = createEventLedger()
    let connectedBefore = false

    const resync = () => {
      // Events may have been missed while offline: REST is the source of truth.
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all, refetchType: 'active' })
      void queryClient.invalidateQueries({ queryKey: cartKeys.all, refetchType: 'active' })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all, refetchType: 'active' })
    }

    const start = async () => {
      await whenRequestsReady()
      const { io } = await import('socket.io-client')
      if (lifecycle.cancelled) return
      socket = io(env.VITE_REALTIME_URL, {
        transports: ['websocket'], // the MSW binding only supports WebSocket
        reconnectionDelay: 500,
        reconnectionDelayMax: 3_000,
      })

      socket.on('connect', () => {
        setStatus('connected')
        const token = currentToken()
        if (userId && token) socket?.emit('session:join', { token })
        if (connectedBefore) {
          resync()
          announceRef.current('Conexão em tempo real restabelecida.')
        }
        connectedBefore = true
      })
      socket.on('disconnect', () => setStatus('reconnecting'))
      socket.on(REALTIME_EVENT_CHANNEL, (raw: unknown) => {
        const parsed = realtimeEventSchema.safeParse(raw)
        if (!parsed.success) return
        const decision = reduceEvent(ledger, parsed.data, { userId })
        if (!decision.accepted) return
        ledger = decision.ledger
        const event = parsed.data
        if (event.type === 'nft.updated') {
          const notice = applyNftUpdated(queryClient, event)
          if (notice) {
            setNotices((current) => [...current.filter((item) => item.nftId !== notice.nftId), notice])
            announceRef.current(
              notice.available === 0
                ? `${notice.name} esgotou. Seu carrinho foi atualizado.`
                : `Preço de ${notice.name} atualizado para ${formatEth(notice.price)}.`,
              'assertive',
            )
          }
        } else {
          applyOrderUpdated(queryClient, event)
          announceRef.current(
            event.data.status === 'confirmed'
              ? 'Pagamento confirmado.'
              : event.data.status === 'rejected'
                ? 'Pagamento recusado.'
                : 'Pedido atualizado.',
          )
        }
      })
    }
    // Realtime is an enhancement: if it can't start, REST (with polling for
    // pending orders) keeps the app correct, and we surface the state.
    start().catch(() => setStatus('reconnecting'))

    return () => {
      lifecycle.cancelled = true
      setNotices([])
      setStatus('connecting')
      if (socket) {
        socket.emit('session:leave')
        socket.removeAllListeners()
        socket.io.removeAllListeners()
        socket.disconnect()
      }
    }
  }, [queryClient, userId])

  const dismissNotice = useCallback(
    (id: string) => setNotices((current) => current.filter((notice) => notice.id !== id)),
    [],
  )
  const value = useMemo(() => ({ status, notices, dismissNotice }), [status, notices, dismissNotice])
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}
