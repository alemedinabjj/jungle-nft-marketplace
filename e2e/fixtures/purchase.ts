import type { Page } from '@playwright/test'
import { expect, login, USERS } from './app'

/** Guest adds an NFT, logs in from the cart and lands on the checkout review step. */
export async function goToReview(page: Page, { nftId = 'nft-001', quantity = 1 } = {}) {
  await page.goto(`/nft/${nftId}`)
  for (let i = 1; i < quantity; i++) await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'Comprar' }).click()
  await page.waitForURL('**/cart')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.getByPlaceholder('contato@email.com').fill(USERS.ana.email)
  await page.getByPlaceholder('Senha').fill(USERS.ana.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL('**/checkout')
  await page.getByLabel('Código de indicação').fill('KURIO-01')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Revise seu pedido' })).toBeFocused()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Conectada').first()).toBeVisible()
}

export { login }
