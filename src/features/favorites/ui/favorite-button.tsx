import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useCurrentUserId } from '@/features/auth'
import { cn } from '@/shared/lib/cn'
import { useAnnounce } from '@/shared/ui/live-region'
import { useFavorites, useToggleFavorite } from '../queries/favorites-queries'

/** "Favoritar" toggle (Figma: outlined button with heart). Anonymous users go to login. */
export function FavoriteButton({ nftId, name }: { nftId: string; name: string }) {
  const userId = useCurrentUserId()
  const favorites = useFavorites()
  const toggle = useToggleFavorite()
  const announce = useAnnounce()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const active = favorites.data?.nftIds.includes(nftId) ?? false

  const onClick = () => {
    if (!userId) {
      void navigate({ to: '/login', search: { redirect: href, reason: 'required' } })
      return
    }
    const next = !active
    toggle.mutate(
      { nftId, favorite: next },
      {
        onSuccess: () =>
          announce(next ? `${name} adicionado aos favoritos.` : `${name} removido dos favoritos.`),
        onError: () =>
          announce(
            `Não foi possível atualizar os favoritos. ${name} voltou ao estado anterior.`,
            'assertive',
          ),
      },
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        disabled={toggle.isPending}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-md border border-primary px-4 text-body transition-colors disabled:opacity-80',
          active ? 'bg-primary/15 text-text-accent' : 'text-text-primary hover:bg-surface-card',
        )}
      >
        <Heart aria-hidden="true" className={cn('size-4', active && 'fill-text-accent text-text-accent')} />
        {active ? 'Favoritado' : 'Favoritar'}
      </button>
      {toggle.isError && (
        <p role="alert" className="text-caption text-danger">
          Não foi possível salvar. Tente novamente.
        </p>
      )}
    </div>
  )
}
