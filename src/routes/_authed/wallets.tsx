import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Container } from '@/shared/ui/container'

export const Route = createFileRoute('/_authed/wallets')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  component: () => <Container className="py-16">Em construção</Container>,
})
