import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <HeadContent />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <div id="main">
        <Outlet />
      </div>
    </>
  )
}
