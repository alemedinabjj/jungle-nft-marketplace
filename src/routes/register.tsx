import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { AuthCard, RegisterForm, safeRedirect, sessionQueryOptions } from '@/features/auth'
import { mergeGuestCart } from '@/features/cart'
import { Container } from '@/shared/ui/container'

export const Route = createFileRoute('/register')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.query(sessionQueryOptions())
    if (session) throw redirect({ href: safeRedirect(search.redirect) })
  },
  head: () => ({
    meta: [
      { title: 'Criar conta — Kurio' },
      { name: 'description', content: 'Crie sua conta de colecionador na Kurio.' },
    ],
  }),
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect: target } = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  return (
    <Container className="py-10 md:py-16">
      <AuthCard
        mode="register"
        redirect={target}
        description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
      >
        <RegisterForm
          onSuccess={async (session) => {
            await mergeGuestCart(queryClient, session.user.id).catch(() => undefined)
            await navigate({ href: safeRedirect(target) })
          }}
        />
      </AuthCard>
    </Container>
  )
}
