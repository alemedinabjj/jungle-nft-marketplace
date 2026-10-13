import { sessionSchema, type LoginRequest, type RegisterRequest, type Session } from '@/shared/contracts'
import { http } from '@/shared/http'

export const authApi = {
  async login(body: LoginRequest): Promise<Session> {
    const { data } = await http.post<unknown>('/auth/login', body)
    return sessionSchema.parse(data)
  },
  async register(body: RegisterRequest): Promise<Session> {
    const { data } = await http.post<unknown>('/auth/register', body)
    return sessionSchema.parse(data)
  },
  async session(signal?: AbortSignal): Promise<Session> {
    const { data } = await http.get<unknown>('/auth/session', { signal })
    return sessionSchema.parse(data)
  },
  async logout(): Promise<void> {
    await http.post('/auth/logout')
  },
}
