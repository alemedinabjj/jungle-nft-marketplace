/** Pure optimistic transition for the favorites set. */
export function toggleFavorite(ids: readonly string[], nftId: string, favorite: boolean): string[] {
  const without = ids.filter((id) => id !== nftId)
  return favorite ? [...without, nftId] : without
}
