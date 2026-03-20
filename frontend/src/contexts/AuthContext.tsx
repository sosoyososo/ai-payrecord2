import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi, userApi } from '@/services/api'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, nickname?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      refreshUser().catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const refreshUser = async () => {
    const response = await userApi.getProfile()
    setUser(response.data.data)
  }

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    const { access_token, refresh_token, user: userData } = response.data.data

    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    setUser(userData)
  }

  const register = async (username: string, email: string, password: string, nickname?: string) => {
    // Register returns { email: string } - user must verify email before logging in
    await authApi.register({ username, email, password, nickname })
    // Don't store tokens or set user - redirect to email verification page
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      await authApi.logout(refreshToken || undefined)
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
