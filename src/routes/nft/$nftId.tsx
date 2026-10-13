import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import {
  NftCard,
  NftCardSkeleton,
  nftDetailOptions,
  relatedOptions,
  useNftDetail,
  useRelated,
} from '@/features/catalog'
import { NftDetailView, RelatedNfts } from '@/features/nft-detail'
import { isAppError } from '@/shared/http'
import { noop } from '@/shared/lib/noop'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { Container } from '@/shared/ui/container'
import { Skeleton } from '@/shared/ui/skeleton'
import { RetryButton, StatusState } from '@/shared/ui/status-state'

export const Route = createFileRoute('/nft/$nftId')({
  loader: async ({ context, params }) => {
    context.queryClient.query(relatedOptions(params.nftId)).catch(noop)
    try {
      const nft = await context.queryClient.query(nftDetailOptions(params.nftId))
      return { name: nft.name, description: nft.description, image: nft.image.src }
    } catch (error) {
      if (isAppError(error) && error.kind === 'not_found') throw notFound()
      // Other failures are rendered by the component (retry), not as a route error.
      return null
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — Kurio` : 'NFT — Kurio' },
      { name: 'description', content: loaderData?.description ?? 'Detalhes do NFT na Kurio.' },
    ],
    links: loaderData ? [{ rel: 'preload', as: 'image', href: loaderData.image, fetchPriority: 'high' }] : [],
  }),
  pendingComponent: DetailSkeleton,
  notFoundComponent: NftNotFound,
  component: NftPage,
})

function NftPage() {
  const { nftId } = Route.useParams()
  const detail = useNftDetail(nftId)
  const related = useRelated(nftId)

  return (
    <Container className="flex flex-col gap-6 pt-8">
      <Breadcrumbs
        items={[
          { label: 'Início', to: '/' },
          { label: 'Mercado', to: '/' },
          { label: detail.data?.name ?? 'NFT' },
        ]}
      />
      {detail.data ? (
        <NftDetailView nft={detail.data} />
      ) : detail.isError ? (
        isAppError(detail.error) && detail.error.kind === 'not_found' ? (
          <NftNotFound />
        ) : (
          <StatusState
            tone="error"
            title="Não foi possível carregar este NFT"
            description={isAppError(detail.error) ? detail.error.message : undefined}
            action={<RetryButton onRetry={() => void detail.refetch()} pending={detail.isFetching} />}
          />
        )
      ) : (
        <DetailSkeleton />
      )}
      <div className="mt-10">
        <RelatedNfts
          title="Mais desta coleção"
          items={related.data}
          renderItem={(nft) => <NftCard nft={nft} />}
        />
        {related.isPending && (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-5" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i}>
                <NftCardSkeleton />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[573px_1fr]" aria-busy="true" aria-label="Carregando NFT">
      <div className="grid gap-4 md:grid-cols-[100px_1fr] md:gap-7">
        <div className="order-2 flex gap-3 md:order-1 md:flex-col md:gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="size-16 rounded-xl md:size-[100px]" />
          ))}
        </div>
        <Skeleton className="order-1 aspect-square w-full rounded-lg md:order-2" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

function NftNotFound() {
  return (
    <Container className="py-16">
      <StatusState
        title="NFT não encontrado"
        description="Este NFT não existe ou foi removido do mercado."
        action={
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-body font-bold text-ink hover:bg-text-accent"
          >
            Ver catálogo
          </Link>
        }
      />
    </Container>
  )
}
