import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { AccountLayout } from '@/app/layout/account-layout'
import { safeRedirect } from '@/features/auth'
import { useWallets, WalletsManager } from '@/features/wallets'
import { isAppError } from '@/shared/http'
import { Skeleton } from '@/shared/ui/skeleton'
import { RetryButton, StatusState } from '@/shared/ui/status-state'

export const Route = createFileRoute('/_authed/wallets')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: 'Carteiras — Kurio' },
      { name: 'description', content: 'Cadastre e edite suas carteiras principal e secundária.' },
    ],
  }),
  component: WalletsPage,
})

function WalletsPage() {
  const wallets = useWallets()
  const { redirect } = Route.useSearch()
  const back = redirect ? safeRedirect(redirect) : null
  return (
    <AccountLayout>
      {back && wallets.data?.some((wallet) => wallet.slot === 'primary') && (
        <Link
          to={back}
          className="mb-6 inline-flex h-10 items-center rounded-md bg-primary px-6 text-body font-bold text-ink hover:bg-text-accent"
        >
          Voltar ao pagamento
        </Link>
      )}
      {wallets.data ? (
        <WalletsManager wallets={wallets.data} />
      ) : wallets.isError ? (
        <StatusState
          tone="error"
          title={
            isAppError(wallets.error) && wallets.error.kind === 'forbidden'
              ? 'Acesso não autorizado'
              : 'Não foi possível carregar suas carteiras'
          }
          description={isAppError(wallets.error) ? wallets.error.message : undefined}
          action={<RetryButton onRetry={() => void wallets.refetch()} pending={wallets.isFetching} />}
        />
      ) : (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando carteiras">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40" />
        </div>
      )}
    </AccountLayout>
  )
}
