/** Anonymous cart owner id, persisted per browser so the guest cart survives refresh. */
const KEY = 'kurio:guest-id'

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function getGuestId(): string {
  const existing = storage()?.getItem(KEY)
  if (existing && /^gst_[a-z0-9]{8,32}$/i.test(existing)) return existing
  const id = `gst_${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`
  storage()?.setItem(KEY, id)
  return id
}
