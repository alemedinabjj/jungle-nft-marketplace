import { expect, login, test, USERS } from '../fixtures/app'

test.describe('conta e sessão', () => {
  test('cadastro valida campos e trata e-mail já existente', async ({ page, mocks }) => {
    await mocks.start('/register')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('Informe seu nome de exibição')).toBeVisible()
    await expect(page.getByPlaceholder('Nome de usuário')).toBeFocused()

    await page.getByPlaceholder('Nome de usuário').fill('Nova Pessoa')
    await page.getByPlaceholder('Digite seu e-mail', { exact: true }).fill(USERS.ana.email)
    await page.getByPlaceholder('Senha', { exact: true }).fill('Senha12345')
    await page.getByPlaceholder('Confirmar senha').fill('Senha12345')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()

    await page.getByPlaceholder('Digite seu e-mail', { exact: true }).fill('nova@kurio.dev')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await page.waitForURL('/')
    await page.goto('/profile')
    await expect(
      page.getByRole('textbox', { name: 'E-mail *' }).or(page.locator('input[name=email]')).first(),
    ).toHaveValue('nova@kurio.dev')
  })

  test('login com senha errada, retorno ao fluxo e sessão após refresh', async ({ page, mocks }) => {
    await mocks.start('/')
    await page.goto('/wallets')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await page.getByPlaceholder('contato@email.com').fill(USERS.ana.email)
    await page.getByPlaceholder('Senha').fill('errada123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByText('E-mail ou senha incorretos.').first()).toBeVisible()
    await page.getByPlaceholder('Senha').fill(USERS.ana.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/wallets/)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  })

  test('sessão expira durante a navegação e o checkout retoma o rascunho', async ({ page, mocks }) => {
    await page.clock.install()
    await mocks.start('/', 'session-expired')
    await login(page, USERS.ana)
    await page.goto('/nft/nft-001')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForURL('**/cart')
    await page.goto('/checkout')
    await page.getByLabel('Código de indicação').fill('KURIO-77')

    // session TTL is 60s in this scenario
    await page.clock.fastForward(61_000)
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(page).toHaveURL(/\/login\?.*reason=expired/)
    await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()

    await page.getByPlaceholder('contato@email.com').fill(USERS.ana.email)
    await page.getByPlaceholder('Senha').fill(USERS.ana.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByLabel('Código de indicação')).toHaveValue('KURIO-77')
  })

  test('logout e troca de usuário não vazam dados', async ({ page, mocks }) => {
    await mocks.start('/')
    await login(page, USERS.ana)
    await page.goto('/nft/nft-001')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForURL('**/cart')
    await expect(page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')).toHaveCount(1)

    await page.goto('/profile')
    await page.getByRole('button', { name: 'Sair' }).click()
    await page.waitForURL('/')
    const storage = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)])
    expect(storage.filter((key) => key.includes('session') || key.includes('checkout'))).toEqual([])

    await login(page, USERS.bruno)
    await page.goto('/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    await page.goto('/favorites')
    await expect(page.getByText('Você ainda não tem favoritos')).toBeVisible()
  })

  test('acesso não autorizado (403) mostra mensagem e permite tentar de novo', async ({ page, mocks }) => {
    await mocks.start('/', 'forbidden')
    await login(page, USERS.ana)
    await page.goto('/profile')
    await expect(page.getByText('Acesso não autorizado')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  })
})
