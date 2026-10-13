import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import { MobileTabBar, SiteHeader } from '@/app/layout/site-header'
import { SessionCoordinator } from '@/app/providers/session-coordinator'
import type { RouterContext } from '@/app/router'
import { CartLink, useCartItemCount } from '@/features/cart'
import { RealtimeProvider, RealtimeStatusBadge } from '@/features/realtime'
import { SiteFooter } from '@/shared/ui/site-footer'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [{ title: 'Kurio — Marketplace de NFTs' }] }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <RealtimeProvider>
      <Layout />
    </RealtimeProvider>
  )
}

function Layout() {
  const cartCount = useCartItemCount()
  return (
    <>
      <HeadContent />
      <SessionCoordinator />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader cartSlot={<CartLink />} statusSlot={<RealtimeStatusBadge />} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileTabBar cartCount={cartCount} />
    </>
  )
}
