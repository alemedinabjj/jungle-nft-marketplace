/**
 * Lighthouse audit plan (versioned): pages, form factors, runs and budgets.
 * Audits run against the optimized build (`vite preview`) with the default mock scenario.
 */
export const PORT = Number(process.env.LH_PORT ?? 4180)
export const BASE_URL = process.env.LH_BASE_URL ?? `http://localhost:${PORT}`
export const RUNS = Number(process.env.LH_RUNS ?? 3)

export const PAGES = [
  { id: 'home', path: '/' },
  { id: 'detail', path: '/nft/nft-001' },
]

export const FORM_FACTORS = ['mobile', 'desktop']

/** Minimum category scores (0–100) on the median run. */
export const TARGETS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
}

export const REPORT_DIR = new URL('./reports/', import.meta.url)

/**
 * Documented exceptions: the target is not enforced for these (regression still is).
 * Justification in ARCHITECTURE.md → Performance.
 */
export const WAIVERS = {
  'detail/mobile': {
    performance: 'LCP is the NFT artwork whose URL comes from the API, served by the in-browser MSW backend',
  },
}
