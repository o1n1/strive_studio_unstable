'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from './useUser'
import { supabase } from '@/lib/supabase/client'

export function useProtectedRoute(requiredRole) {
  const router = useRouter()
  const { profile, loading: userLoading } = useUser()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthorization = async () => {
      if (userLoading) return

      // No hay sesión
      if (!profile) {
        router.push('/')
        return
      }

      // Si es coach, verificar estado
      if (profile.rol === 'coach') {
        const { data: coachData } = await supabase
          .from('coaches')
          .select('estado, activo')
          .eq('id', profile.id)
          .single()

        // Si coach no está activo o pendiente/rechazado → /coach/pendiente
        if (
          !coachData?.activo || 
          coachData?.estado === 'pendiente' || 
          coachData?.estado === 'rechazado'
        ) {
          if (requiredRole === 'coach') {
            router.push('/coach/pendiente')
            return
          }
        }
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
    }

    checkAuthorization()
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