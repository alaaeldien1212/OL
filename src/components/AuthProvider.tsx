'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/store'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, hydrated } = useAppStore()

  useEffect(() => {
    if (!hydrated) return

    // Check if user is trying to access a protected route without auth
    const protectedRoutes = ['/admin', '/teacher', '/student']
    const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))
    
    if (isProtectedRoute && !isAuthenticated) {
      // Redirect to home if trying to access protected route without auth
      router.replace('/')
    }
  }, [hydrated, isAuthenticated, pathname, router])

  return <>{children}</>
}

