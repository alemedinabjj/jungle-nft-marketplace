import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UpsertWalletRequest, Wallet, WalletSlot } from '@/shared/contracts'
import { useCurrentUserId } from '@/features/auth'
import { walletsApi } from '../api/wallets-api'

export const walletKeys = {
  all: ['wallets'] as const,
  list: (userId: string) => [...walletKeys.all, userId] as const,
}

export const walletsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: walletKeys.list(userId),
    queryFn: ({ signal }) => walletsApi.list(signal),
    staleTime: 30_000,
  })

export function useWallets() {
  const userId = useCurrentUserId()
  return useQuery({ ...walletsQueryOptions(userId ?? 'anonymous'), enabled: userId !== null })
}

function useWalletMutation<T>(mutationFn: (variables: T) => Promise<Wallet>) {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  return useMutation({
    mutationFn,
    onSuccess: (wallet) => {
      if (!userId) return
      queryClient.setQueryData<Wallet[]>(walletKeys.list(userId), (current = []) => {
        const others = current.filter((candidate) => candidate.slot !== wallet.slot)
        return [...others, wallet].sort((a, b) => a.slot.localeCompare(b.slot))
      })
    },
  })
}

export const useUpsertWallet = () =>
  useWalletMutation(({ slot, body }: { slot: WalletSlot; body: UpsertWalletRequest }) =>
    walletsApi.upsert(slot, body),
  )
export const useConnectWallet = () => useWalletMutation((id: string) => walletsApi.connect(id))
export const useDisconnectWallet = () => useWalletMutation((id: string) => walletsApi.disconnect(id))
