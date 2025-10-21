import { create } from 'zustand'
import { User, UserRole } from '@/types'

interface AppState {
  user: User | null
  userRole: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setUser: (user: User | null, role: UserRole | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  userRole: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setUser: (user, role) =>
    set({
      user,
      userRole: role,
      isAuthenticated: !!user,
      error: null,
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () =>
    set({
      user: null,
      userRole: null,
      isAuthenticated: false,
      error: null,
    }),
}))

interface ThemeState {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}))
