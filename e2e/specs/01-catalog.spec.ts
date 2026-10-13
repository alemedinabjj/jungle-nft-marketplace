import type { Page } from '@playwright/test'
import { expect, isMobile, test } from '../fixtures/app'

const grid = (page: Page) => page.getByRole('list', { name: 'NFTs' })

async function withFilters(page: Page, action: () => Promise<void>) {
  if (isMobile(page)) {
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    await action()
    await page.keyboard.press('Escape')
  } else {
    await action()
  }
}

async function search(page: Page, q: string) {
  if (isMobile(page)) {
    const box = page.getByRole('searchbox', { name: 'Buscar NFTs' })
    await box.fill(q)
    await box.press('Enter')
  } else {
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    const box = page.locator('#site-search')
    await box.fill(q)
    await box.press('Enter')
  }
}

test.describe('catálogo', () => {
  test('busca, filtros combinados, ordenação, paginação e histórico', async ({ page, mocks }) => {
    await mocks.start('/')
    await expect(grid(page).getByRole('listitem')).toHaveCount(9)

    // pagination keeps state in the URL
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    const secondPageFirst = await grid(page).getByRole('heading').first().innerText()

    // any filter change resets to page 1
    await withFilters(page, async () => {
      await page.locator('label:visible', { hasText: 'Música' }).click()
      await page.locator('label:visible', { hasText: 'Solana' }).click()
    })
    await expect(page).toHaveURL(/categories=music/)
    await expect(page).toHaveURL(/networks=solana/)
    await expect(page).not.toHaveURL(/page=/)
    await expect(grid(page).getByRole('heading', { name: 'Golden Beat #207' })).toBeVisible()

    // search narrows the combined filters
    // (header search starts a fresh query; re-apply filters through the URL state)
    await page.goto(`${page.url().split('#')[0]}&q=pulse`)
    await expect(grid(page).getByRole('listitem')).toHaveCount(1)
    await expect(grid(page).getByRole('heading', { name: 'Golden Pulse #233' })).toBeVisible()

    // history: back restores previous state, forward re-applies
    await page.goBack()
    await expect(page).not.toHaveURL(/q=pulse/)
    await expect(grid(page).getByRole('heading', { name: 'Golden Beat #207' })).toBeVisible()
    await page.goForward()
    await expect(grid(page).getByRole('listitem')).toHaveCount(1)

    // survives refresh
    await page.reload()
    await expect(grid(page).getByRole('heading', { name: 'Golden Pulse #233' })).toBeVisible()

    // back to page 2 of the unfiltered catalog
    await page.goto('/?page=2')
    await expect(grid(page).getByRole('listitem')).toHaveCount(9)
    await expect(grid(page).getByRole('heading').first()).toHaveText(secondPageFirst)
  })

  test('ordenação por preço usa a URL', async ({ page, mocks }) => {
    await mocks.start('/?sort=price-asc')
    const prices = await grid(page).locator('p:has-text("ETH") > span:first-child').allInnerTexts()
    const values = prices.map((text) => Number(text.replace(/[^\d.]/g, '')))
    expect(values).toEqual([...values].sort((a, b) => a - b))
  })

  test('resultado vazio oferece limpar filtros', async ({ page, mocks }) => {
    await mocks.start('/?q=nada-disso-existe')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).first().click()
    await expect(grid(page).getByRole('listitem')).toHaveCount(9)
  })

  test('catálogo vazio no cenário empty-catalog', async ({ page, mocks }) => {
    await mocks.start('/', 'empty-catalog')
    await expect(page.getByText('Ainda não há NFTs listados no mercado.')).toBeVisible()
  })

  test('respostas fora de ordem: a última busca vence', async ({ page, mocks }) => {
    await mocks.start('/', 'out-of-order')
    await expect(grid(page).getByRole('listitem')).toHaveCount(9)
    // rapid client-side searches: earlier requests are slower and resolve last
    await search(page, 'golden')
    await search(page, 'nomad')
    await search(page, 'ivory')
    await expect(page).toHaveURL(/q=ivory/)
    await expect(grid(page).getByRole('heading', { name: 'Ivory Baron #088' })).toBeVisible()
    await page.waitForTimeout(2_500)
    await expect(grid(page).getByRole('heading', { name: /Golden|Nomad/ })).toHaveCount(0)
    await expect(grid(page).getByRole('heading', { name: 'Ivory Baron #088' })).toBeVisible()
  })
})
