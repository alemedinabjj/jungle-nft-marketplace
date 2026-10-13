import { expect, test } from '../fixtures/app'

/**
 * Visual regression of the Figma-backed screens. Deterministic: fixed fixtures,
 * reset db, reduced motion (no shimmer/transitions) and lazy images forced to load.
 */
async function settle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy]').forEach((img) => img.setAttribute('loading', 'eager'))
    // decode() resolves only once the selected source is fully loaded and decoded
    await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)))
    await document.fonts.ready
  })
  await page.waitForLoadState('networkidle')
}

const MASK = ['[data-testid=realtime-status]']

test.describe('regressão visual', () => {
  test('início', async ({ page, mocks }) => {
    await mocks.start('/')
    await expect(page.getByRole('list', { name: 'NFTs' }).getByRole('listitem')).toHaveCount(9)
    await settle(page)
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
      mask: MASK.map((s) => page.locator(s)),
    })
  })

  test('detalhe', async ({ page, mocks }) => {
    await mocks.start('/nft/nft-001')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('detail.png', {
      fullPage: true,
      mask: MASK.map((s) => page.locator(s)),
    })
  })

  test('carrinho', async ({ page, mocks }) => {
    await mocks.start('/nft/nft-001')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForURL('**/cart')
    await expect(
      page.getByRole('complementary', { name: 'Resumo da carteira' }).getByText('1.206 ETH'),
    ).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('cart.png', {
      fullPage: true,
      mask: MASK.map((s) => page.locator(s)),
    })
  })

  test('pagamento', async ({ page, mocks }) => {
    await mocks.start('/nft/nft-001')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForURL('**/cart')
    await page.goto('/login?redirect=%2Fcheckout')
    await page.getByPlaceholder('contato@email.com').fill('ana@kurio.dev')
    await page.getByPlaceholder('Senha').fill('Kurio2026')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await page.waitForURL('**/checkout')
    await expect(page.getByLabel('Código de indicação')).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('checkout.png', {
      fullPage: true,
      mask: MASK.map((s) => page.locator(s)),
    })
  })
})
