import { http, HttpResponse } from 'msw'
import { upsertWalletRequestSchema, walletSlotSchema, type Wallet } from '@/shared/contracts'
import { mutateDb } from '../../db/store'
import { API, apiError, applyScenario, readJson, requireUser, validationError } from '../../lib/http'
import { getScenario } from '../../scenarios/controller'

export const walletHandlers = [
  http.get(`${API}/wallets`, async ({ request }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const failure = await applyScenario('wallets', request)
    if (failure) return failure
    return HttpResponse.json(auth.db.wallets[auth.user.id] ?? [])
  }),

  /** Create or replace the wallet in a slot (primary | secondary). */
  http.put(`${API}/wallets/:slot`, async ({ request, params }) => {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const failure = await applyScenario('wallets', request)
    if (failure) return failure
    const slot = walletSlotSchema.safeParse(params.slot)
    if (!slot.success) return apiError(404, 'WALLET_SLOT_NOT_FOUND', 'Posição de carteira inexistente.')
    const parsed = upsertWalletRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    const wallets = auth.db.wallets[auth.user.id] ?? []
    if (slot.data === 'secondary' && !wallets.some((wallet) => wallet.slot === 'primary')) {
      return apiError(422, 'PRIMARY_REQUIRED', 'Cadastre a carteira principal primeiro.', {
        address: 'Cadastre a carteira principal primeiro.',
      })
    }
    const duplicate = wallets.find(
      (wallet) =>
        wallet.slot !== slot.data && wallet.address.toLowerCase() === parsed.data.address.toLowerCase(),
    )
    if (duplicate) {
      return apiError(409, 'WALLET_DUPLICATE', 'Este endereço já está cadastrado na outra posição.', {
        address: 'Este endereço já está cadastrado na outra carteira.',
      })
    }
    const wallet = await mutateDb((db) => {
      const list = (db.wallets[auth.user.id] ??= [])
      const existing = list.find((candidate) => candidate.slot === slot.data)
      const next: Wallet = {
        id: existing?.id ?? `wal_${auth.user.id}_${slot.data}`,
        slot: slot.data,
        ...parsed.data,
        label: parsed.data.label || (slot.data === 'primary' ? 'Carteira principal' : 'Carteira secundária'),
        // Changing address/provider/network requires reconnecting.
        status:
          existing &&
          existing.address === parsed.data.address &&
          existing.provider === parsed.data.provider &&
          existing.network === parsed.data.network
            ? existing.status
            : 'disconnected',
      }
      if (existing) Object.assign(existing, next)
      else list.push(next)
      return next
    })
    return HttpResponse.json(wallet)
  }),

  ...(['connect', 'disconnect'] as const).map((action) =>
    http.post(`${API}/wallets/:id/${action}`, async ({ request, params }) => {
      const auth = await requireUser(request)
      if (!auth.ok) return auth.response
      const failure = await applyScenario('wallets', request)
      if (failure) return failure
      const wallet = auth.db.wallets[auth.user.id]?.find((candidate) => candidate.id === params.id)
      if (!wallet) return apiError(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
      if (action === 'connect' && getScenario().walletConnection === 'rejected') {
        return apiError(
          409,
          'WALLET_REJECTED',
          'A conexão foi recusada na carteira. Tente novamente ou use outra carteira.',
        )
      }
      const updated = await mutateDb(() => {
        wallet.status = action === 'connect' ? 'connected' : 'disconnected'
        return wallet
      })
      return HttpResponse.json(updated)
    }),
  ),
]
