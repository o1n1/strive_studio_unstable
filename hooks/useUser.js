'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useUser() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error obteniendo sesión:', error)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // Función reutilizable para obtener perfil
    const fetchProfile = async (userId) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (mounted && profileData) {
        setProfile(profileData)
      }
    }

    getInitialSession()

    // Escuchar cambios en autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.rol === 'admin',
    isCoach: profile?.rol === 'coach',
    isCliente: profile?.rol === 'cliente',
    isStaff: profile?.rol === 'staff'
  }
}