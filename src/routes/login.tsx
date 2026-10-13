import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { AuthCard, LoginForm, safeRedirect, sessionQueryOptions } from '@/features/auth'
import { mergeGuestCart } from '@/features/cart'
import { Container } from '@/shared/ui/container'
import { FormAlert } from '@/shared/ui/form-alert'

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  reason: z.enum(['expired', 'required']).optional().catch(undefined),
})

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.query(sessionQueryOptions())
    if (session) throw redirect({ href: safeRedirect(search.redirect) })
  },
  head: () => ({
    meta: [{ title: 'Entrar — Kurio' }, { name: 'description', content: 'Entre na sua conta Kurio.' }],
  }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect: target, reason } = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  return (
    <Container className="py-10 md:py-16">
      <AuthCard
        mode="login"
        redirect={target}
        description="Entre para gerenciar sua carteira, coleção e perfil de criador."
        notice={
          reason === 'expired' ? (
            <FormAlert tone="info">
              Sua sessão expirou. Entre novamente para continuar de onde parou.
            </FormAlert>
          ) : reason === 'required' ? (
            <FormAlert tone="info">Entre na sua conta para continuar.</FormAlert>
          ) : undefined
        }
      >
        <LoginForm
          onSuccess={async (session) => {
            await mergeGuestCart(queryClient, session.user.id).catch(() => undefined)
            await navigate({ href: safeRedirect(target) })
          }}
        />
      </AuthCard>
    </Container>
  )
}
