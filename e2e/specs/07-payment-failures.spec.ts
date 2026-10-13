import { expect, test } from '../fixtures/app'
import { goToReview } from '../fixtures/purchase'

test.describe('falhas de pagamento', () => {
  test('pagamento recusado preserva o carrinho', async ({ page, mocks }) => {
    await mocks.start('/', 'payment-rejected')
    await goToReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')).toHaveCount(1)
  })

  test('clique repetido não duplica o pedido', async ({ page, mocks }) => {
    await mocks.start('/')
    await goToReview(page)
    const confirm = page.getByRole('button', { name: 'Confirmar compra' })
    await expect(confirm).toBeEnabled()
    const posts: string[] = []
    page.on('request', (request) => {
      if (request.url().endsWith('/api/orders') && request.method() === 'POST')
        posts.push(request.headers()['idempotency-key'] ?? '')
    })
    // two native clicks dispatched before React re-renders the disabled state
    await confirm.dblclick()
    await expect(page).toHaveURL(/\/orders\/ord_/)
    expect(new Set(posts).size).toBeLessThanOrEqual(1)
    const db = await mocks.db<{ orders: unknown[] }>()
    expect(db.orders).toHaveLength(1)
  })

  test('timeout após criar o pedido recupera o mesmo pedido', async ({ page, mocks }) => {
    await mocks.start('/', 'order-timeout')
    await goToReview(page)
    const created: string[] = []
    page.on('request', (request) => {
      if (request.url().endsWith('/api/orders') && request.method() === 'POST')
        created.push(request.headers()['idempotency-key'] ?? '')
    })
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 30_000 })
    // retried with the same Idempotency-Key and the server returned the same order
    expect(created.length).toBeGreaterThanOrEqual(2)
    expect(new Set(created).size).toBe(1)
    const db = await mocks.db<{ orders: unknown[] }>()
    expect(db.orders).toHaveLength(1)
  })

  test('refresh no meio da compra retoma o mesmo pedido', async ({ page, mocks }) => {
    await mocks.start('/', 'order-timeout')
    await goToReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await page.waitForTimeout(1_000)
    await page.reload()
    await mocks.ready()
    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 30_000 })
    const db = await mocks.db<{ orders: unknown[] }>()
    expect(db.orders).toHaveLength(1)
  })

  test('carteira recusa a conexão', async ({ page, mocks }) => {
    await mocks.start('/', 'wallet-rejected')
    await page.goto('/nft/nft-001')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForURL('**/cart')
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await page.getByPlaceholder('contato@email.com').fill('ana@kurio.dev')
    await page.getByPlaceholder('Senha').fill('Kurio2026')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await page.getByLabel('Código de indicação').fill('KURIO-01')
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(page.getByRole('heading', { name: 'Revise seu pedido' })).toBeVisible()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText('A conexão foi recusada na carteira.').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
  })
})
