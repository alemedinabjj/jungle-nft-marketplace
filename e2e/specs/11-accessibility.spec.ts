import { expect, expectNoA11yViolations, isMobile, login, test, USERS } from '../fixtures/app'

test.describe('acessibilidade', () => {
  test('sem violações sérias do axe nas telas principais', async ({ page, mocks }) => {
    test.setTimeout(120_000)
    await mocks.start('/')
    await expect(page.getByRole('list', { name: 'NFTs' })).toBeVisible()
    await expectNoA11yViolations(page)
    for (const path of ['/nft/nft-001', '/cart', '/login', '/register', '/rota-inexistente']) {
      await page.goto(path)
      await page.locator('#main').waitFor()
      await page.waitForTimeout(800)
      await expectNoA11yViolations(page)
    }
    await login(page, USERS.ana, '/profile')
    for (const path of ['/profile', '/wallets', '/favorites', '/checkout']) {
      await page.goto(path)
      await page.locator('main').waitFor()
      await page.waitForTimeout(800)
      await expectNoA11yViolations(page)
    }
  })

  test('teclado: link de pular conteúdo e foco visível', async ({ page, mocks }) => {
    await mocks.start('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main/)
  })

  test('foco preso no drawer de filtros e devolvido ao fechar', async ({ page, mocks }) => {
    test.skip(!isMobile(page), 'drawer only on small screens')
    await mocks.start('/')
    const trigger = page.getByRole('button', { name: 'Abrir filtros' })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Filtros' })
    await expect(dialog).toBeVisible()
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('validação de formulário associa erros aos campos', async ({ page, mocks }) => {
    await mocks.start('/login')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    const email = page.getByPlaceholder('contato@email.com')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText(/Informe um e-mail válido/)
    await expect(email).toBeFocused()
  })
})
