import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/features/auth'

/**
 * Pathless guard for private routes (checkout, orders, profile, wallets,
 * favorites). Unauthenticated users are sent to login with a return path.
 */
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.query(sessionQueryOptions())
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href, reason: 'required' } })
    }
    return { session }
  },
  component: Outlet,
})
