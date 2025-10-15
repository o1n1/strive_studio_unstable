import { supabase } from '@/lib/supabase/client'

/**
 * Obtiene el token de autenticación actual
 * @returns {Promise<string>} Token de acceso
 * @throws {Error} Si no hay sesión activa
 */
export async function getAuthToken() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error al obtener sesión:', error)
      throw new Error('Error al verificar la sesión. Por favor recarga la página.')
    }
    
    if (!session) {
      throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.')
    }
    
    if (!session.access_token) {
      throw new Error('Token de acceso no encontrado.')
    }
    
    return session.access_token
  } catch (error) {
    console.error('Error en getAuthToken:', error)
    throw error
  }
}

/**
 * Realiza un fetch con autenticación automática
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    const token = await getAuthToken()
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
    
    return fetch(url, {
      ...options,
      headers
    })
  } catch (error) {
    console.error('Error en authenticatedFetch:', error)
    throw error
  }
}
