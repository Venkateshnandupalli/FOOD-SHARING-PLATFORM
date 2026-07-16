import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui'
import type { UserRole } from '@/types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(40,20%,97%)]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
          <p className="text-sm text-[hsl(220,10%,52%)] font-medium">Loading SharePlate AI…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (profile && !profile.is_onboarded) {
    return <Navigate to="/choose-role" replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to their own dashboard
    const roleRoutes: Record<UserRole, string> = {
      ADMIN: '/admin',
      DONOR: '/donor',
      RECIPIENT: '/recipient',
      VOLUNTEER: '/volunteer',
      ANALYST: '/analytics',
    }
    return <Navigate to={roleRoutes[profile.role]} replace />
  }

  return <>{children}</>
}
