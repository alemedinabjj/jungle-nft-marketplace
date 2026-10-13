import { expect, login, test, USERS } from '../fixtures/app'

// 1×1 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('perfil e carteiras', () => {
  test('perfil: validação local, conflito da API, salvar e avatar', async ({ page, mocks }) => {
    await mocks.start('/')
    await login(page, USERS.ana, '/profile')
    const username = page.getByLabel('Nome de usuário')
    await username.fill('Ana!!')
    await username.blur()
    await expect(page.getByText('Use apenas letras minúsculas, números, ponto ou _')).toBeVisible()
    await expect(username).toHaveAttribute('aria-invalid', 'true')

    await username.fill('bruno.costa')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Escolha outro nome de usuário.')).toBeVisible()

    await username.fill('ana.colecoes')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado.' })).toBeVisible()

    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG })
    await expect(page.getByRole('img', { name: 'Seu avatar atual' })).toBeVisible()
    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByRole('img', { name: 'Seu avatar atual' })).toHaveCount(0)

    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') })
    await expect(page.getByText('Use uma imagem PNG, JPG ou WebP.')).toBeVisible()
  })

  test('validação vinda do servidor (422) aparece no campo', async ({ page, mocks }) => {
    await mocks.start('/', 'validation-error')
    await login(page, USERS.ana, '/profile')
    await page.getByLabel('Nome de exibição').fill('Ana R.')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Este nome de usuário está reservado.')).toBeVisible()
  })

  test('troca de senha: senha atual errada e sucesso', async ({ page, mocks }) => {
    await mocks.start('/')
    await login(page, USERS.ana, '/profile')
    await page.getByLabel('Senha atual').fill('errada123')
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha1')
    await page.getByLabel('Confirmar nova senha').fill('Diferente1')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('As senhas não coincidem')).toBeVisible()
    await page.getByLabel('Confirmar nova senha').fill('NovaSenha1')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha atual incorreta.')).toBeVisible()
    await page.getByLabel('Senha atual').fill(USERS.ana.password)
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha alterada com sucesso.').first()).toBeVisible()
  })

  test('carteiras: editar principal, adicionar secundária, erros e conexão', async ({ page, mocks }) => {
    await mocks.start('/')
    await login(page, USERS.ana, '/wallets')
    const primary = page.getByRole('form', { name: 'Carteira principal' })
    await primary.getByLabel('Endereço da carteira').fill('0x123')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(primary.getByText(/Endereço inválido/)).toBeVisible()

    await page.getByRole('button', { name: 'Adicionar' }).click()
    const secondary = page.getByRole('form', { name: 'Carteira secundária' })
    await secondary.getByLabel('Endereço da carteira').fill('0x8ba1f109551bD432803012645Ac136ddd64DBA72')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(secondary.getByText('Este endereço já está cadastrado na outra carteira.')).toBeVisible()
    await secondary.getByLabel('Endereço da carteira').fill('0x1111111111111111111111111111111111111111')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText(/0x1111…1111 — desconectada/)).toBeVisible()

    await page.getByRole('button', { name: 'Conectar' }).first().click()
    await expect(page.getByText(/— conectada/).first()).toBeVisible()
    await page.getByRole('button', { name: 'Desconectar' }).click()
    await expect(page.getByText(/— conectada/)).toHaveCount(0)
  })
})
