import { expect, login, test, USERS } from '../fixtures/app'

test.describe('favoritos', () => {
  test('falha na mutation desfaz a atualização otimista e avisa', async ({ page, mocks }) => {
    await mocks.start('/', 'favorites-failure')
    await login(page, USERS.ana)
    await page.goto('/nft/nft-003', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Favoritar' })).toBeVisible()
    await expect(page.getByText('Não foi possível salvar. Tente novamente.')).toBeVisible()
    await expect(page.getByTestId('live-assertive')).toContainText('voltou ao estado anterior')
  })

  test('recupera após a falha e persiste por usuário', async ({ page, mocks }) => {
    await mocks.start('/', 'favorites-failure')
    await login(page, USERS.ana)
    await page.goto('/nft/nft-003', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page.getByText('Não foi possível salvar')).toBeVisible()

    await mocks.setScenario('default')
    const saved = page.waitForResponse(
      (response) => response.url().includes('/api/favorites/') && response.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Favoritar' }).click()
    await saved
    await page.reload()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()
    await page.goto('/favorites')
    await expect(
      page.getByRole('list', { name: 'NFTs favoritos' }).getByRole('heading', { name: 'Neon Vessel #552' }),
    ).toBeVisible()
  })

  test('visitante é levado ao login ao favoritar', async ({ page, mocks }) => {
    await mocks.start('/nft/nft-003')
    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Fnft-003/)
  })
})
