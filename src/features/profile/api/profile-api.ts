import {
  userSchema,
  type ChangePasswordRequest,
  type UpdateProfileRequest,
  type User,
} from '@/shared/contracts'
import { http } from '@/shared/http'

export const profileApi = {
  async get(signal?: AbortSignal): Promise<User> {
    const { data } = await http.get<unknown>('/profile', { signal })
    return userSchema.parse(data)
  },
  async update(body: UpdateProfileRequest): Promise<User> {
    const { data } = await http.put<unknown>('/profile', body)
    return userSchema.parse(data)
  },
  async setAvatar(dataUrl: string): Promise<User> {
    const { data } = await http.put<unknown>('/profile/avatar', { dataUrl })
    return userSchema.parse(data)
  },
  async removeAvatar(): Promise<User> {
    const { data } = await http.delete<unknown>('/profile/avatar')
    return userSchema.parse(data)
  },
  async changePassword(body: ChangePasswordRequest): Promise<void> {
    await http.put('/profile/password', body)
  },
}
