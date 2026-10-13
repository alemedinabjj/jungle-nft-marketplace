import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { LoginRequest, RegisterRequest, Session } from '@/shared/contracts'
import { isAppError } from '@/shared/http'
import { authApi } from '../api/auth-api'
import {
  clearStoredSession,
  isSessionExpired,
  readStoredSession,
  writeStoredSession,
} from '../model/session-store'

export const authKeys = {
  session: ['auth', 'session'] as const,
}

/**
 * The session is the root of every private query key. `null` = anonymous.
 * Recovered from storage on refresh and validated against the API.
 */
export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.session,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async ({ signal }): Promise<Session | null> => {
      const stored = readStoredSession()
      if (!stored) return null
      if (isSessionExpired(stored)) {
        clearStoredSession()
        return null
      }
      try {
        return await authApi.session(signal)
      } catch (error) {
        if (isAppError(error) && error.kind === 'unauthorized') {
          clearStoredSession()
          return null
        }
        throw error
      }
    },
  })

export function useSession() {
  return useQuery(sessionQueryOptions())
}

/** Convenience accessor for the current user id (null when anonymous or loading). */
export function useCurrentUserId(): string | null {
  return useSession().data?.user.id ?? null
}

function persist(queryClient: QueryClient, session: Session): void {
  writeStoredSession({ token: session.token, userId: session.user.id, expiresAt: session.expiresAt })
  queryClient.setQueryData(authKeys.session, session)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (session) => persist(queryClient, session),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: (session) => persist(queryClient, session),
  })
}

/**
 * Drops every trace of the user on this device: token, all cached queries
 * (private keys include the userId, but we clear everything to be safe).
 * Realtime teardown reacts to the session becoming null.
 */
export function endSession(queryClient: QueryClient): void {
  clearStoredSession()
  void queryClient.cancelQueries()
  queryClient.clear()
  queryClient.setQueryData(authKeys.session, null)
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout()
      } catch {
        // Logging out locally must succeed even if the server call fails.
      }
    },
    onSettled: () => endSession(queryClient),
  })
}
