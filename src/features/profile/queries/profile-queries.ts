import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChangePasswordRequest, Session, UpdateProfileRequest, User } from '@/shared/contracts'
import { authKeys, useCurrentUserId } from '@/features/auth'
import { profileApi } from '../api/profile-api'

export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
}

export const profileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: profileKeys.detail(userId),
    queryFn: ({ signal }) => profileApi.get(signal),
    staleTime: 60_000,
  })

export function useProfile() {
  const userId = useCurrentUserId()
  return useQuery({ ...profileQueryOptions(userId ?? 'anonymous'), enabled: userId !== null })
}

/** Profile writes also refresh the session user so the header reflects them. */
function useUserMutation<T>(mutationFn: (variables: T) => Promise<User>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (user) => {
      queryClient.setQueryData(profileKeys.detail(user.id), user)
      queryClient.setQueryData<Session | null>(authKeys.session, (session) =>
        session ? { ...session, user } : session,
      )
    },
  })
}

export const useUpdateProfile = () => useUserMutation((body: UpdateProfileRequest) => profileApi.update(body))
export const useSetAvatar = () => useUserMutation((dataUrl: string) => profileApi.setAvatar(dataUrl))
export const useRemoveAvatar = () => useUserMutation(() => profileApi.removeAvatar())
export const useChangePassword = () =>
  useMutation({ mutationFn: (body: ChangePasswordRequest) => profileApi.changePassword(body) })
