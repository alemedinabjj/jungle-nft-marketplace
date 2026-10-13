/**
 * Minimal stand-in for `tldts`, aliased in vite.config.ts for the browser build.
 *
 * MSW → tough-cookie imports `getDomain` from tldts, which ships the whole Public
 * Suffix List (~150 KB) just to validate cookie domains. The simulated backend
 * never sets cookies (auth is a Bearer token), so a structural approximation is
 * enough and keeps the mock worker chunk small. Not used by application code.
 */
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/

export function getDomain(hostname: string | null | undefined): string | null {
  if (!hostname) return null
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (host === 'localhost' || IPV4.test(host) || host.includes(':')) return host
  const labels = host.split('.')
  return labels.length <= 2 ? host : labels.slice(-2).join('.')
}
