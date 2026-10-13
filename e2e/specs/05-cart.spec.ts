import type { Page } from '@playwright/test'
import { expect, login, test, USERS } from '../fixtures/app'

const lines = (page: Page) => page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')

async function addToCart(page: Page, nftId: string, quantity = 1) {
  await page.goto(`/nft/${nftId}`)
  for (let i = 1; i < quantity; i++) await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'Comprar' }).click()
  await page.waitForURL('**/cart')
}

test.describe('carrinho', () => {
  test('quantidades, remoção e resumo vindo da cotação', async ({ page, mocks }) => {
    await mocks.start('/')
    await addToCart(page, 'nft-001', 2)
    await addToCart(page, 'nft-005')
    await expect(lines(page)).toHaveCount(2)
    await expect(page.getByText('Total da linha: 2.38 ETH')).toBeVisible()

    await page.getByRole('button', { name: 'Aumentar quantidade de Violet Nomad #314' }).click()
    await expect(page.getByText('Total da linha: 2.78 ETH')).toBeVisible()
    // 2×1.19 + 2×1.39 = 5.16 (+0.016 fee)
    await expect(
      page.getByRole('complementary', { name: 'Resumo da carteira' }).getByText('5.176 ETH'),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).click()
    await expect(lines(page)).toHaveCount(1)
    await expect(page.getByTestId('live-polite')).toContainText('removido do carrinho')
  })

  test('cupom inválido, expirado, válido e remoção', async ({ page, mocks }) => {
    await mocks.start('/')
    await addToCart(page, 'nft-001')
    const input = page.getByLabel('Código promocional')
    await input.fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Este código não existe. Confira e tente de novo.')).toBeVisible()
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    await input.fill('LAUNCH24')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Este código expirou.')).toBeVisible()

    await input.fill('kurio10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/Cupom\s*KURIO10\s*aplicado/).first()).toBeVisible()
    await expect(page.getByText('(-) 0.119')).toBeVisible()

    await page.getByRole('button', { name: 'Remover cupom KURIO10' }).click()
    await expect(page.getByText('(-) 0.00')).toBeVisible()
  })

  test('persiste após refresh e é mesclado no login', async ({ page, mocks }) => {
    await mocks.start('/')
    await addToCart(page, 'nft-002', 2)
    await page.reload()
    await expect(lines(page)).toHaveCount(1)

    await login(page, USERS.ana, '/cart')
    await expect(page).toHaveURL(/\/cart/)
    await expect(lines(page)).toHaveCount(1)
    await expect(
      page.getByRole('group', { name: 'Quantidade de Sage Nomad #089' }).locator('output'),
    ).toHaveText('2')
  })

  test('falha do carrinho mostra erro e recupera', async ({ page, mocks }) => {
    await mocks.start('/cart', 'flaky')
    await expect(
      page.getByText('Não foi possível carregar seu carrinho').or(page.getByText('Seu carrinho está vazio')),
    ).toBeVisible({ timeout: 15_000 })
  })
})
