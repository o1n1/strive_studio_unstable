import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Verifica autenticación y autorización en API routes
 * @param {Request} request - Request object de Next.js
 * @param {Object} options - Opciones de autorización
 * @param {string[]} options.allowedRoles - Roles permitidos (ej: ['admin', 'coach'])
 * @param {boolean} options.requireAuth - Si requiere autenticación (default: true)
 * @returns {Promise<{user, profile, supabase, error}>}
 */
export async function verifyAuth(request, options = {}) {
  const { allowedRoles = [], requireAuth = true } = options

  // 1. Verificar token de autenticación
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (requireAuth) {
      return {
        error: NextResponse.json(
          { error: 'No autenticado - Token requerido' },
          { status: 401 }
        )
      }
    }
    return { user: null, profile: null, supabase: null }
  }

  const token = authHeader.replace('Bearer ', '')

  // 2. Crear cliente Supabase con Service Role (para bypasear RLS si es necesario)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // 3. Verificar usuario
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }
  }

  // 4. Obtener perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, rol, nombre, apellidos, email, activo')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        { error: 'Perfil de usuario no encontrado' },
        { status: 404 }
      )
    }
  }

  // 5. Verificar que el usuario esté activo
  if (!profile.activo) {
    return {
      error: NextResponse.json(
        { error: 'Usuario desactivado' },
        { status: 403 }
      )
    }
  }

  // 6. Verificar rol si se especificaron roles permitidos
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.rol)) {
    return {
      error: NextResponse.json(
        { 
          error: 'No autorizado',
          message: `Esta acción requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
          yourRole: profile.rol
        },
        { status: 403 }
      )
    }
  }

  // ✅ Todo OK - retornar datos del usuario
  return {
    user,
    profile,
    supabase,
    error: null
  }
}

/**
 * Wrapper para API routes que requieren autenticación
 * Simplifica el manejo de errores y autenticación
 * 
 * @example
 * export const POST = withAuth(async (request, { user, profile, supabase }) => {
 *   // Tu lógica aquí
 *   return NextResponse.json({ success: true })
 * }, { allowedRoles: ['admin'] })
 */
export function withAuth(handler, options = {}) {
  return async (request, context) => {
    // Verificar autenticación
    const authResult = await verifyAuth(request, options)
    
    // Si hay error, retornarlo inmediatamente
    if (authResult.error) {
      return authResult.error
    }

    // Ejecutar handler con datos de autenticación
    try {
      return await handler(request, {
        ...context, // Mantener params y otros datos de Next.js
        user: authResult.user,
        profile: authResult.profile,
        supabase: authResult.supabase
      })
    } catch (error) {
      console.error('Error en API handler:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }
}

/**
 * Crea un cliente Supabase para operaciones sin autenticación
 * (útil para endpoints públicos que necesitan acceder a la DB)
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}