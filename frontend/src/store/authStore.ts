import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  nickname: string
  is_admin: boolean
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        set({ token, user })
      },
      logout: () => {
        set({ token: null, user: null })
        // 彻底清除 persist 存储，确保无残留
        localStorage.removeItem('auth-storage')
      },
    }),
    { name: 'auth-storage' }
  )
)
