import { http, HttpResponse } from 'msw'
import { CATALOG_PAGE_SIZE, catalogQuerySchema, type CatalogQuery, type Featured } from '@/shared/contracts'
import { getDb } from '../../db/store'
import { API, apiError, applyScenario, validationError } from '../../lib/http'
import { queryCatalog, toSummary } from './query'

function list(params: URLSearchParams, key: string): string[] | undefined {
  const raw = params.get(key)
  return raw ? raw.split(',').filter(Boolean) : undefined
}

export function parseCatalogQuery(url: URL): ReturnType<typeof catalogQuerySchema.safeParse> {
  const params = url.searchParams
  const candidate: Record<keyof CatalogQuery, unknown> = {
    q: params.get('q') ?? undefined,
    categories: list(params, 'categories'),
    networks: list(params, 'networks'),
    minPrice: params.get('minPrice') ?? undefined,
    maxPrice: params.get('maxPrice') ?? undefined,
    tab: params.get('tab') ?? 'all',
    sort: params.get('sort') ?? 'recent',
    page: Number(params.get('page') ?? 1),
    pageSize: Number(params.get('pageSize') ?? CATALOG_PAGE_SIZE),
  }
  return catalogQuerySchema.safeParse(candidate)
}

export const catalogHandlers = [
  http.get(`${API}/nfts`, async ({ request }) => {
    const failure = await applyScenario('catalog', request)
    if (failure) return failure
    const parsed = parseCatalogQuery(new URL(request.url))
    if (!parsed.success) return validationError(parsed.error.issues)
    const db = await getDb()
    return HttpResponse.json(queryCatalog(db.nfts, parsed.data))
  }),

  http.get(`${API}/nfts/featured`, async ({ request }) => {
    const failure = await applyScenario('catalog', request)
    if (failure) return failure
    const db = await getDb()
    const hero = db.nfts.find((nft) => nft.id === 'nft-001') ?? db.nfts[0]
    const spotlight = db.nfts.find((nft) => nft.id === 'nft-005') ?? db.nfts[1]
    if (!hero || !spotlight) return apiError(404, 'NOT_FOUND', 'Nenhum destaque disponível.')
    const body: Featured = { hero: toSummary(hero), spotlight: toSummary(spotlight) }
    return HttpResponse.json(body)
  }),

  http.get(`${API}/nfts/:id`, async ({ request, params }) => {
    const failure = await applyScenario('detail', request)
    if (failure) return failure
    const db = await getDb()
    const nft = db.nfts.find((candidate) => candidate.id === params.id)
    if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'Este NFT não existe ou foi removido.')
    const { popularity: _popularity, ...detail } = nft
    return HttpResponse.json(detail)
  }),

  http.get(`${API}/nfts/:id/related`, async ({ request, params }) => {
    const failure = await applyScenario('detail', request)
    if (failure) return failure
    const db = await getDb()
    const nft = db.nfts.find((candidate) => candidate.id === params.id)
    if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'Este NFT não existe ou foi removido.')
    const related = nft.relatedIds.flatMap((id) => {
      const match = db.nfts.find((candidate) => candidate.id === id)
      return match ? [toSummary(match)] : []
    })
    return HttpResponse.json(related)
  }),
]
