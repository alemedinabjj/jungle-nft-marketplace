import { test as base, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

export const USERS = {
  ana: { email: 'ana@kurio.dev', password: 'Kurio2026', name: 'Ana' },
  bruno: { email: 'bruno@kurio.dev', password: 'Kurio2026', name: 'Bruno' },
} as const

interface MockControlApi {
  getScenario(): string
  setScenario(id: string): Promise<void>
  reset(id?: string): Promise<void>
  updateNft(
    nftId: string,
    patch: { price?: string; priceDelta?: string; editionAvailable?: Record<string, number> },
  ): Promise<{ eventId: string }>
  replayEvent(eventId: string): void
  replayAsStale(eventId: string): Promise<void>
  disconnectSockets(): number
}

declare global {
  interface Window {
    __kurioMocks?: MockControlApi
  }
}

/** Server-side controls of the simulated backend (events still travel via socket.io-client). */
export class Mocks {
  constructor(private readonly page: Page) {}

  /** Fresh, isolated state: clear storage, reset db to the scenario seed, wait until mocks are live. */
  async start(path = '/', scenario = 'default') {
    const separator = path.includes('?') ? '&' : '?'
    await this.page.goto(`${path}${separator}scenario=${scenario}&mock-reset`)
    await this.ready()
  }

  /** Mock backend live and React mounted over the static shell (whose controls are inert). */
  async ready() {
    await this.page.waitForFunction(
      () => window.__kurioMocks !== undefined && document.documentElement.dataset.appReady === 'true',
    )
  }

  setScenario(id: string) {
    return this.page.evaluate((scenario) => window.__kurioMocks?.setScenario(scenario), id)
  }

  updateNft(nftId: string, patch: Parameters<MockControlApi['updateNft']>[1]) {
    return this.page.evaluate(([id, p]) => window.__kurioMocks!.updateNft(id, p), [nftId, patch] as const)
  }

  replayEvent(eventId: string) {
    return this.page.evaluate((id) => window.__kurioMocks?.replayEvent(id), eventId)
  }

  replayAsStale(eventId: string) {
    return this.page.evaluate((id) => window.__kurioMocks?.replayAsStale(id), eventId)
  }

  disconnectSockets() {
    return this.page.evaluate(() => window.__kurioMocks?.disconnectSockets())
  }

  /** Read the persisted simulated db (assertions only). */
  db<T = { orders: unknown[]; carts: { ownerKey: string; items: unknown[] }[] }>() {
    return this.page.evaluate(
      () => JSON.parse(localStorage.getItem('kurio:mock-db') ?? '{}') as unknown,
    ) as Promise<T>
  }
}

export async function login(page: Page, user: (typeof USERS)[keyof typeof USERS], redirect?: string) {
  await page.goto(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login')
  await page.getByPlaceholder('contato@email.com').fill(user.email)
  await page.getByPlaceholder('Senha').fill(user.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL((url) => url.pathname !== '/login')
}

export async function waitForRealtime(page: Page) {
  await expect(page.locator('[data-testid=realtime-status]:visible')).toHaveAttribute(
    'data-status',
    'connected',
    {
      timeout: 10_000,
    },
  )
}

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(
    serious.map(
      (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
    ),
  ).toEqual([])
}

export function isMobile(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1440) < 768
}

export const test = base.extend<{ mocks: Mocks }>({
  mocks: async ({ page }, use) => {
    await use(new Mocks(page))
  },
})

export { expect }
