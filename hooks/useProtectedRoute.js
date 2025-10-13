'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from './useUser'

export function useProtectedRoute(requiredRole) {
  const router = useRouter()
  const { profile, loading: userLoading } = useUser()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return

    // No hay sesión
    if (!profile) {
      router.push('/')
      return
    }

    // Verificar rol
    if (profile.rol !== requiredRole) {
      const redirectUrl = getRedirectUrl(profile.rol)
      router.push(redirectUrl)
      return
    }

    // Autorizado
    setIsAuthorized(true)
    setLoading(false)
  }, [profile, userLoading, requiredRole])

  function getRedirectUrl(rol) {
    const routes = {
      admin: '/admin/dashboard',
      coach: '/coach/clases',
      cliente: '/cliente/reservas',
      staff: '/staff/checkin'
    }
    return routes[rol] || '/'
  }

  return { isAuthorized, loading }
}