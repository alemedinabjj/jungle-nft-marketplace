/**
 * Lighthouse audit plan (versioned): pages, form factors, runs and budgets.
 * Audits run against the optimized build (`vite preview`) with the default mock scenario.
 */
export const PORT = Number(process.env.LH_PORT ?? 4180)
export const BASE_URL = process.env.LH_BASE_URL ?? `http://localhost:${PORT}`
export const RUNS = Number(process.env.LH_RUNS ?? 3)

const only = (list, env) => (env ? list.filter((item) => env.split(',').includes(item.id ?? item)) : list)

/** Narrow a local run with LH_PAGES=home and/or LH_FORM_FACTORS=mobile. */
export const PAGES = only(
  [
    { id: 'home', path: '/' },
    { id: 'detail', path: '/nft/nft-001' },
  ],
  process.env.LH_PAGES,
)

export const FORM_FACTORS = only(['mobile', 'desktop'], process.env.LH_FORM_FACTORS)

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
    performance:
      'LCP is the NFT artwork whose URL comes from the API; here the API is MSW running in the browser, so its download/boot is on the LCP path',
  },
}
