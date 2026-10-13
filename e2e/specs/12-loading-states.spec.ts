import { expect, test } from '../fixtures/app'

test.describe('carregamento e recuperação', () => {
  test('skeletons com carregamento lento preservam o layout', async ({ page, mocks }) => {
    await mocks.start('/', 'slow')
    await page.goto('/?page=2')
    const loading = page.getByRole('list', { name: 'Carregando NFTs' })
    await expect(loading).toBeVisible()
    const box = await loading.boundingBox()
    await expect(page.getByRole('list', { name: 'NFTs' })).toBeVisible({ timeout: 15_000 })
    const loaded = await page.getByRole('list', { name: 'NFTs' }).boundingBox()
    // same column grid → no layout shift of the section start
    expect(Math.abs((box?.y ?? 0) - (loaded?.y ?? 0))).toBeLessThan(2)
  })

  test('skeleton do detalhe e do resumo do carrinho', async ({ page, mocks }) => {
    await mocks.start('/', 'slow')
    await page.goto('/nft/nft-004')
    await expect(page.getByLabel('Carregando NFT')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Cosmic Bloom #118' })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForURL('**/cart')
    await expect(
      page.getByLabel('Calculando valores').or(page.getByLabel('Carregando carrinho')),
    ).toBeVisible()
  })

  test('falha de conexão mostra feedback e recupera após nova tentativa', async ({ page, mocks }) => {
    await mocks.start('/', 'network-error')
    await page.goto('/?page=3')
    await expect(page.getByText('Não foi possível carregar o catálogo')).toBeVisible({ timeout: 15_000 })
    await mocks.setScenario('default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('list', { name: 'NFTs' }).getByRole('listitem')).toHaveCount(9)
  })

  test('erro 5xx no detalhe permite tentar de novo', async ({ page, mocks }) => {
    await mocks.start('/', 'server-error')
    await page.goto('/nft/nft-001')
    await expect(page.getByText('Não foi possível carregar este NFT')).toBeVisible({ timeout: 15_000 })
    await mocks.setScenario('default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })
})
