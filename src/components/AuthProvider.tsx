'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/store'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userRole, isAuthenticated } = useAppStore()
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (hasChecked) return

    // Check if user is trying to access a protected route without auth
    const protectedRoutes = ['/admin', '/teacher', '/student']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    
    if (isProtectedRoute && !isAuthenticated) {
      // Redirect to home if trying to access protected route without auth
      router.push('/')
    }

    setHasChecked(true)
  }, [isAuthenticated, user, userRole, pathname, router, hasChecked])

  return <>{children}</>
}

