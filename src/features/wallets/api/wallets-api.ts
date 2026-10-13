import { z } from 'zod'
import { walletSchema, type UpsertWalletRequest, type Wallet, type WalletSlot } from '@/shared/contracts'
import { http } from '@/shared/http'

export const walletsApi = {
  async list(signal?: AbortSignal): Promise<Wallet[]> {
    const { data } = await http.get<unknown>('/wallets', { signal })
    return z.array(walletSchema).parse(data)
  },
  async upsert(slot: WalletSlot, body: UpsertWalletRequest): Promise<Wallet> {
    const { data } = await http.put<unknown>(`/wallets/${slot}`, body)
    return walletSchema.parse(data)
  },
  async connect(id: string): Promise<Wallet> {
    const { data } = await http.post<unknown>(`/wallets/${encodeURIComponent(id)}/connect`)
    return walletSchema.parse(data)
  },
  async disconnect(id: string): Promise<Wallet> {
    const { data } = await http.post<unknown>(`/wallets/${encodeURIComponent(id)}/disconnect`)
    return walletSchema.parse(data)
  },
}
