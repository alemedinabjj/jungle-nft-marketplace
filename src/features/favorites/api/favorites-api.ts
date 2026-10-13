import { favoritesSchema, type Favorites } from '@/shared/contracts'
import { http } from '@/shared/http'

export const favoritesApi = {
  async list(signal?: AbortSignal): Promise<Favorites> {
    const { data } = await http.get<unknown>('/favorites', { signal })
    return favoritesSchema.parse(data)
  },
  async set(nftId: string, favorite: boolean): Promise<Favorites> {
    const url = `/favorites/${encodeURIComponent(nftId)}`
    const { data } = favorite ? await http.put<unknown>(url) : await http.delete<unknown>(url)
    return favoritesSchema.parse(data)
  },
}
