import { createFileRoute } from '@tanstack/react-router'
import { AccountLayout } from '@/app/layout/account-layout'
import { PasswordForm, ProfileForm, useProfile } from '@/features/profile'
import { isAppError } from '@/shared/http'
import { Skeleton } from '@/shared/ui/skeleton'
import { RetryButton, StatusState } from '@/shared/ui/status-state'

export const Route = createFileRoute('/_authed/profile')({
  head: () => ({
    meta: [
      { title: 'Meu perfil — Kurio' },
      { name: 'description', content: 'Edite seus dados, avatar e senha.' },
    ],
  }),
  component: ProfilePage,
})

function ProfilePage() {
  const profile = useProfile()
  return (
    <AccountLayout>
      {profile.data ? (
        <div className="flex flex-col gap-12">
          <ProfileForm key={profile.data.id} user={profile.data} />
          <PasswordForm />
        </div>
      ) : profile.isError ? (
        <StatusState
          tone="error"
          title={
            isAppError(profile.error) && profile.error.kind === 'forbidden'
              ? 'Acesso não autorizado'
              : 'Não foi possível carregar seu perfil'
          }
          description={isAppError(profile.error) ? profile.error.message : undefined}
          action={<RetryButton onRetry={() => void profile.refetch()} pending={profile.isFetching} />}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2" aria-busy="true" aria-label="Carregando perfil">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[70px]" />
          ))}
        </div>
      )}
    </AccountLayout>
  )
}
