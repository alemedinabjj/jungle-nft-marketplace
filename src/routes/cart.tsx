import { createFileRoute } from '@tanstack/react-router'
import { Container } from '@/shared/ui/container'

export const Route = createFileRoute('/cart')({
  component: () => <Container className="py-16">Em construção</Container>,
})
