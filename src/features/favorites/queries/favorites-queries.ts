import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Favorites } from '@/shared/contracts'
import { useCurrentUserId } from '@/features/auth'
import { favoritesApi } from '../api/favorites-api'
import { toggleFavorite } from '../model/toggle'

export const favoriteKeys = {
  all: ['favorites'] as const,
  list: (userId: string) => [...favoriteKeys.all, userId] as const,
}

export const favoritesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: favoriteKeys.list(userId),
    queryFn: ({ signal }) => favoritesApi.list(signal),
    staleTime: 60_000,
  })

export function useFavorites() {
  const userId = useCurrentUserId()
  return useQuery({ ...favoritesQueryOptions(userId ?? 'anonymous'), enabled: userId !== null })
}

/**
 * Optimistic toggle with rollback: the heart flips immediately; on failure the
 * previous snapshot is restored and the caller is told (announce + message).
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  const key = favoriteKeys.list(userId ?? 'anonymous')

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      favoritesApi.set(nftId, favorite),
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Favorites>(key)
      queryClient.setQueryData<Favorites>(key, {
        nftIds: toggleFavorite(previous?.nftIds ?? [], nftId, favorite),
      })
      return { previous }
    },
    onError: (_error, { nftId, favorite }, context) => {
      // Restore the snapshot; if the list wasn't loaded yet, revert our own transition.
      queryClient.setQueryData<Favorites>(
        key,
        (current) => context?.previous ?? { nftIds: toggleFavorite(current?.nftIds ?? [], nftId, !favorite) },
      )
    },
    onSuccess: (favorites) => {
      queryClient.setQueryData(key, favorites)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
