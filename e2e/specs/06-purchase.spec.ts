import { expect, test } from '../fixtures/app'
import { goToReview } from '../fixtures/purchase'

test('compra completa: do catálogo ao recibo confirmado', async ({ page, mocks }) => {
  await mocks.start('/')
  await page.getByRole('list', { name: 'NFTs' }).getByRole('link', { name: 'Emerald Ape #042' }).click()
  await expect(page).toHaveURL(/\/nft\/nft-001/)

  await goToReview(page, { quantity: 2 })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page).toHaveURL(/\/orders\/ord_/)
  const orderUrl = page.url()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
    timeout: 15_000,
  })
  const receipt = page.getByRole('article')
  await expect(receipt.getByText('2.396 ETH').first()).toBeVisible()
  await expect(receipt.getByRole('cell', { name: '(x 2)' })).toBeVisible()
  await expect(receipt.getByText(/^0x[0-9A-F]{4}…[0-9A-F]{4}$/)).toBeVisible()

  // only the purchased quantities leave the cart
  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()

  // receipt is a snapshot: later catalog changes don't alter it
  await mocks.updateNft('nft-001', { price: '9.99' })
  await page.goBack()
  await expect(page).toHaveURL(orderUrl)
  await expect(page.getByRole('article').getByText('2.38 ETH').first()).toBeVisible()
})
