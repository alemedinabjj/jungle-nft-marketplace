import { expect, test, waitForRealtime } from '../fixtures/app'
import { goToReview } from '../fixtures/purchase'

test.describe('tempo real no checkout', () => {
  test('preço muda via Socket.IO com o carrinho aberto: aviso e resumo atualizado', async ({
    page,
    mocks,
  }) => {
    await mocks.start('/nft/nft-001')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForURL('**/cart')
    await waitForRealtime(page)
    await mocks.updateNft('nft-001', { priceDelta: '0.5' })
    await expect(
      page.getByRole('alert').filter({ hasText: 'O preço de Emerald Ape #042 subiu' }),
    ).toBeVisible()
    await expect(page.getByText('Total da linha: 1.69 ETH')).toBeVisible()
    await expect(
      page.getByRole('complementary', { name: 'Resumo da carteira' }).getByText('1.706 ETH'),
    ).toBeVisible()
  })

  test('checkout bloqueia a confirmação com cotação desatualizada', async ({ page, mocks }) => {
    await mocks.start('/')
    await goToReview(page)
    await waitForRealtime(page)
    await mocks.updateNft('nft-001', { priceDelta: '0.25' })
    await expect(page.getByText('Os valores mudaram desde a sua revisão')).toBeVisible()
    await expect(page.getByText(/Emerald Ape #042: preço de 1.19 ETH para 1.44 ETH/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()

    await page.getByRole('button', { name: 'Revisar novos valores' }).click()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('article').getByText('1.44 ETH').first()).toBeVisible()
  })

  test('edição esgota durante a compra: o servidor recusa e o usuário ajusta', async ({ page, mocks }) => {
    await mocks.start('/', 'sold-out')
    await goToReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: /esgotou|Restam/ })
        .first(),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
  })
})
