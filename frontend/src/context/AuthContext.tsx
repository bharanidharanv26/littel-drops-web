import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, authApi } from '@/services/api'
import type { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  profile: User | null
  role: UserRole | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: string | null; mustChangePassword?: boolean }>
  signOut: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>
  isFounder: boolean
  isTrustee: boolean
  isStaff: boolean
  canWrite: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile() {
    try {
      const { user: userData } = await authApi.getMe()
      setProfile(userData as User)
      return true
    } catch {
      setProfile(null)
      api.setToken(null)
      return false
    }
  }

  useEffect(() => {
    const token = api.getToken()
    if (token) {
      fetchProfile().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function signIn(
    username: string,
    password: string
  ): Promise<{ error: string | null; mustChangePassword?: boolean }> {
    try {
      const { user: userData, token, mustChangePassword } = await authApi.login(username, password)
      api.setToken(token)
      setProfile(userData as User)
      return { error: null, mustChangePassword }
    } catch (error: any) {
      return { error: error.message || 'Login failed' }
    }
  }

  async function signOut() {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    }
    api.setToken(null)
    setProfile(null)
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      await authApi.changePassword(currentPassword, newPassword)
      // Refresh profile to update mustChangePassword
      await fetchProfile()
      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Password change failed' }
    }
  }

  const role = profile?.role ?? null
  const isFounder = role === 'founder'
  const isTrustee = role === 'trustee'
  const isStaff = role === 'staff'
  const isActive = profile?.isActive !== false
  const canWrite = isActive && (isFounder || isStaff)

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        profile,
        role,
        loading,
        signIn,
        signOut,
        changePassword,
        isFounder,
        isTrustee,
        isStaff,
        canWrite,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
