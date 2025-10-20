/**
 * Utilidad para hacer fetch con autenticación
 * Usado en componentes del cliente
 */
import { supabase } from '@/lib/supabase/client'

export async function authenticatedFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No hay sesión activa')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  return response
}
