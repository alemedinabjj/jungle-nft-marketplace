import { http, HttpResponse } from 'msw'
import type { Favorites } from '@/shared/contracts'
import { mutateDb } from '../../db/store'
import { API, apiError, applyScenario, requireUser } from '../../lib/http'

export const favoritesHandlers = [
  http.get(`${API}/favorites`, async ({ request }) => {
    await applyScenario('auth', request)
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const body: Favorites = { nftIds: auth.db.favorites[auth.user.id] ?? [] }
    return HttpResponse.json(body)
  }),

  ...(['put', 'delete'] as const).map((method) =>
    http[method](`${API}/favorites/:nftId`, async ({ request, params }) => {
      const auth = await requireUser(request)
      if (!auth.ok) return auth.response
      const failure = await applyScenario('favorites', request)
      if (failure) return failure
      const nftId = String(params.nftId)
      if (!auth.db.nfts.some((nft) => nft.id === nftId))
        return apiError(404, 'NFT_NOT_FOUND', 'Este NFT não existe.')
      const nftIds = await mutateDb((db) => {
        const current = new Set(db.favorites[auth.user.id] ?? [])
        if (method === 'put') current.add(nftId)
        else current.delete(nftId)
        db.favorites[auth.user.id] = [...current]
        return db.favorites[auth.user.id]!
      })
      const body: Favorites = { nftIds }
      return HttpResponse.json(body)
    }),
  ),
]
