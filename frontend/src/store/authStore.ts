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
        localStorage.setItem('access_token', token)
        set({ token, user })
      },
      logout: () => {
        localStorage.removeItem('access_token')
        set({ token: null, user: null })
      },
    }),
    { name: 'auth-storage' }
  )
)
