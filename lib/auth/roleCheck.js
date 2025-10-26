// lib/auth/roleCheck.js
import { createClient } from '@supabase/supabase-js'

/**
 * Verifica si el usuario tiene el rol requerido
 * @param {string} userId - ID del usuario autenticado
 * @param {string|string[]} requiredRoles - Rol(es) requerido(s)
 * @returns {Promise<{authorized: boolean, userRole: string|null}>}
 */
export async function checkUserRole(userId, requiredRoles) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { authorized: false, userRole: null }
    }

    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    const authorized = rolesArray.includes(profile.rol)

    return { authorized, userRole: profile.rol }
  } catch (error) {
    console.error('Error verificando rol:', error)
    return { authorized: false, userRole: null }
  }
}

/**
 * Middleware para proteger API routes por rol
 * Uso en API routes:
 * 
 * export async function POST(req) {
 *   const { data: { user } } = await supabase.auth.getUser()
 *   
 *   const { authorized, userRole } = await checkUserRole(user.id, 'admin')
 *   if (!authorized) {
 *     return new Response(
 *       JSON.stringify({ error: 'No autorizado' }), 
 *       { status: 403 }
 *     )
 *   }
 *   
 *   // Continuar con operación...
 * }
 */

/**
 * Verifica si usuario es admin
 */
export async function isAdmin(userId) {
  const { authorized } = await checkUserRole(userId, 'admin')
  return authorized
}

/**
 * Verifica si usuario es coach
 */
export async function isCoach(userId) {
  const { authorized } = await checkUserRole(userId, 'coach')
  return authorized
}

/**
 * Verifica si usuario es staff o admin
 */
export async function isStaffOrAdmin(userId) {
  const { authorized } = await checkUserRole(userId, ['staff', 'admin'])
  return authorized
}

/**
 * Obtiene el rol del usuario
 */
export async function getUserRole(userId) {
  const { userRole } = await checkUserRole(userId, [])
  return userRole
}

/**
 * Helper para respuestas de error 403
 */
export function forbiddenResponse(message = 'No autorizado') {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message 
    }), 
    { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

/**
 * Helper para validar que el usuario no cambie su propio rol
 */
export async function preventRoleChange(userId, newRole) {
  const currentRole = await getUserRole(userId)
  
  if (currentRole !== newRole) {
    throw new Error('No puedes cambiar tu propio rol')
  }
  
  return true
}