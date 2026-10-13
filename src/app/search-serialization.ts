/**
 * Human-readable URLs: `?categories=music,3d-art&maxPrice=1.5&page=2`
 * instead of the default JSON encoding. Route schemas (Zod) parse and
 * validate these plain strings, so nothing here needs to know types.
 */
export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.map(String).join(','))
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params.set(key, String(value))
    }
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function parseSearch(searchStr: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr))
}
