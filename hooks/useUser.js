'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

// Función para obtener sesión y perfil en una sola operación
async function fetchUserProfile() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    return null
  }

  return {
    user: session.user,
    profile
  }
}

export function useUser() {
  const queryClient = useQueryClient()

  // Query con caché de 5 minutos
  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1
  })

  // Escuchar cambios de autenticación en tiempo real
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          // Invalidar caché y refrescar al iniciar sesión
          queryClient.invalidateQueries({ queryKey: ['user'] })
        } else if (event === 'SIGNED_OUT') {
          // Limpiar caché al cerrar sesión
          queryClient.setQueryData(['user'], null)
        } else if (event === 'TOKEN_REFRESHED') {
          // Refrescar datos al renovar token
          queryClient.invalidateQueries({ queryKey: ['user'] })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    loading: isLoading,
    error,
    isAuthenticated: !!data?.user,
    isAdmin: data?.profile?.rol === 'admin',
    isCoach: data?.profile?.rol === 'coach',
    isCliente: data?.profile?.rol === 'cliente',
    isStaff: data?.profile?.rol === 'staff'
  }
}

// Hook para invalidar caché manualmente (útil después de actualizar perfil)
export function useInvalidateUser() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['user'] })
  }
}