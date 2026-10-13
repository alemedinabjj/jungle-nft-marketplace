import { expect, test } from '../fixtures/app'

test.describe('detalhe do NFT', () => {
  test('acesso direto, edição e limite de quantidade', async ({ page, mocks }) => {
    await mocks.start('/nft/nft-001')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page).toHaveTitle(/Emerald Ape #042/)

    // 1/1 edition allows a single unit
    await page.getByText('1/1', { exact: true }).click()
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()

    // 1/10 edition: limited by stock and per-order cap
    await page.getByText('1/10', { exact: true }).click()
    const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
    for (let i = 0; i < 12; i++) if (await increase.isEnabled()) await increase.click()
    await expect(increase).toBeDisabled()
    await expect(page.getByRole('group', { name: 'Quantidade' }).locator('output')).toHaveText('4')
  })

  test('edição esgotada fica indisponível', async ({ page, mocks }) => {
    // nft-005 has its 1/1 edition sold out in the fixtures
    await mocks.start('/nft/nft-005')
    await expect(page.locator('input[name=edition][value="1-of-1"]')).toBeDisabled()
  })

  test('NFT inexistente e rota inexistente mostram 404', async ({ page, mocks }) => {
    await mocks.start('/nft/nao-existe')
    await expect(
      page.getByRole('heading', { name: 'NFT não encontrado' }).or(page.getByText('NFT não encontrado')),
    ).toBeVisible()
    await page.goto('/rota/que/nao/existe')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })

  test('falha ao carregar detalhe permite tentar de novo', async ({ page, mocks }) => {
    await mocks.start('/', 'flaky')
    await page.goto('/nft/nft-002')
    await mocks.ready()
    await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #089' })).toBeVisible({
      timeout: 15_000,
    })
  })
})
