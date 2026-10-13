import { useQueries } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { NftCard, NftCardSkeleton, nftDetailOptions } from '@/features/catalog'
import { useFavorites } from '@/features/favorites'
import { Container } from '@/shared/ui/container'
import { RetryButton, StatusState } from '@/shared/ui/status-state'

export const Route = createFileRoute('/_authed/favorites')({
  head: () => ({
    meta: [{ title: 'Favoritos — Kurio' }, { name: 'description', content: 'Seus NFTs favoritos.' }],
  }),
  component: FavoritesPage,
})

function FavoritesPage() {
  const favorites = useFavorites()
  const ids = favorites.data?.nftIds ?? []
  const details = useQueries({ queries: ids.map((id) => nftDetailOptions(id)) })

  return (
    <Container className="flex flex-col gap-8 pt-10">
      <h1 className="text-heading font-bold text-text-primary">Favoritos</h1>
      {favorites.isPending ? (
        <ul
          className="grid grid-cols-2 gap-6 md:grid-cols-4"
          aria-busy="true"
          aria-label="Carregando favoritos"
        >
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : favorites.isError ? (
        <StatusState
          tone="error"
          title="Não foi possível carregar seus favoritos"
          action={<RetryButton onRetry={() => void favorites.refetch()} />}
        />
      ) : ids.length === 0 ? (
        <StatusState
          title="Você ainda não tem favoritos"
          description="Toque em “Favoritar” na página de um NFT para guardá-lo aqui."
          action={
            <Link
              to="/"
              hash="catalogo"
              className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-body font-bold text-ink"
            >
              Explorar NFTs
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4" aria-label="NFTs favoritos">
          {details.map((detail, index) => (
            <li key={ids[index]}>{detail.data ? <NftCard nft={detail.data} /> : <NftCardSkeleton />}</li>
          ))}
        </ul>
      )}
    </Container>
  )
}
