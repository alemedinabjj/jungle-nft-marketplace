import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { normalizeShell } from '../../scripts/shell-utils.mjs'

/**
 * The static shell inlined in index.html must match what React renders before any
 * data arrives; otherwise the swap would flash or shift. Regenerate with
 * `pnpm build && pnpm shell:update` after changing the header or the hero.
 */
test('o shell estático corresponde ao primeiro render do app', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'markup is viewport-independent')
  await page.route(/\/assets\/(browser|control)-[^/]+\.js$/, () => new Promise(() => {}))
  // Below-the-fold content renders on idle (Deferred); keep it out of the shell.
  await page.addInitScript(() => {
    window.requestIdleCallback = () => 0
  })
  await page.goto('/?shell-capture')
  await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
  const rendered = normalizeShell(await page.evaluate(() => document.getElementById('root')?.innerHTML ?? ''))
  const committed = (
    await readFile(new URL('../../src/app/shell/home-shell.html', import.meta.url), 'utf8')
  ).trim()
  expect(rendered, 'run `pnpm build && pnpm shell:update`').toBe(committed)
})

test('o shell é substituído pelo app e rotas internas não exibem o hero', async ({ page }) => {
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: /seja dono do futuro/i })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
