import { expect, login, test, USERS, waitForRealtime } from '../fixtures/app'
import { goToReview } from '../fixtures/purchase'

test.describe('eventos em tempo real', () => {
  test('ignora eventos duplicados e versões antigas', async ({ page, mocks }) => {
    await mocks.start('/nft/nft-001')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForURL('**/cart')
    await waitForRealtime(page)

    const { eventId } = await mocks.updateNft('nft-001', { price: '2.00' })
    await expect(page.getByText('Total da linha: 2.00 ETH')).toBeVisible()
    await page.getByRole('button', { name: 'Dispensar aviso' }).click()

    // the same event again (duplicate eventId) must not re-apply effects
    await mocks.replayEvent(eventId)
    // a new event id carrying an older version must not regress state
    await mocks.replayAsStale(eventId)
    await page.waitForTimeout(800)
    await expect(page.getByRole('alert').filter({ hasText: 'Emerald Ape #042' })).toHaveCount(0)

    await mocks.updateNft('nft-001', { price: '1.50' })
    await expect(page.getByText('Total da linha: 1.50 ETH')).toBeVisible()
  })

  test('reconecta e ressincroniza via REST o que mudou offline', async ({ page, mocks }) => {
    await mocks.start('/nft/nft-001')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForURL('**/cart')
    await waitForRealtime(page)

    await mocks.disconnectSockets()
    await expect(page.locator('[data-testid=realtime-status]:visible')).toHaveAttribute(
      'data-status',
      'reconnecting',
    )
    await mocks.updateNft('nft-001', { price: '3.00' }) // event lost while offline
    await waitForRealtime(page)
    await expect(page.getByText('Total da linha: 3.00 ETH')).toBeVisible()
  })

  test('conexão cai com pedido pendente: após reconectar/refresh recupera o mesmo pedido', async ({
    page,
    mocks,
  }) => {
    await mocks.start('/')
    await goToReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('heading', { name: 'Processando seu pagamento…' })).toBeVisible()
    const orderUrl = page.url()
    await mocks.disconnectSockets()
    await page.reload()
    await mocks.ready()
    await expect(page).toHaveURL(orderUrl)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
      timeout: 15_000,
    })
    const db = await mocks.db<{ orders: unknown[] }>()
    expect(db.orders).toHaveLength(1)
  })

  test('eventos de pedido de outro usuário não chegam após a troca de conta', async ({ page, mocks }) => {
    await mocks.start('/')
    await goToReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/orders\//)
    // log out before settlement and log in as Bruno: Ana's order.updated must not reach him
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Sair' }).click()
    await login(page, USERS.bruno)
    await waitForRealtime(page)
    await page.waitForTimeout(2_000)
    await expect(page.getByTestId('live-polite')).not.toContainText('Pagamento confirmado')
  })
})
