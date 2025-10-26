import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/auth/api-auth'
import { checkRateLimit, clearRateLimit, getClientIP } from '@/lib/utils/rateLimit'
import { logger } from '@/lib/utils/logger'
import { validateEmail } from '@/lib/validations'

const MAX_LOGIN_ATTEMPTS = 10

/**
 * API de Login
 * Endpoint PÚBLICO - No requiere autenticación previa
 * 
 * @route POST /api/login
 * @access Public
 */
export async function POST(request) {
  logger.log('🔵 Endpoint /api/login llamado')

  try {
    // 🛡️ CSRF PROTECTION - Verificar origin
    const origin = request.headers.get('origin')
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      'http://localhost:3000',
      'https://localhost:3000'
    ].filter(Boolean)
    
    if (origin && !allowedOrigins.includes(origin)) {
      logger.warn(`⚠️ Origin no permitido: ${origin}`)
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado' },
        { status: 403 }
      )
    }

    // Validar Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      logger.error('❌ Content-Type inválido')
      return NextResponse.json(
        { success: false, error: 'Content-Type debe ser application/json' },
        { status: 400 }
      )
    }

    // Obtener datos del body
    const body = await request.json()
    const { email, password } = body

    // Validar campos requeridos
    if (!email || !password) {
      logger.error('❌ Campos requeridos faltantes')
      return NextResponse.json(
        { success: false, error: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }

    // 🛡️ VALIDACIÓN DE FORMATO EMAIL en backend
    if (!validateEmail(email)) {
      logger.warn('⚠️ Intento de login con email inválido')
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Validar longitud mínima de contraseña
    if (password.length < 8) {
      logger.warn('⚠️ Contraseña demasiado corta')
      return NextResponse.json(
        { success: false, error: 'Contraseña debe tener mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    // 🛡️ VALIDACIÓN DE RATE LIMITING por IP + Email (más estricto)
    const ip = getClientIP(request)
    const rateLimitKey = `${ip}:${email}`
    const { allowed, remaining } = checkRateLimit(rateLimitKey, MAX_LOGIN_ATTEMPTS)
    
    if (!allowed) {
      logger.warn(`⚠️ Rate limit excedido para: ${rateLimitKey}`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.',
          remaining: 0
        },
        { status: 429 }
      )
    }
    
    logger.log(`✅ Rate limit OK - Intentos restantes: ${remaining}`)

    // Crear cliente Supabase con Service Role
    const supabase = createServiceClient()

    // Intentar login
    logger.log(`🔑 Intentando login para: ${email}`)
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (authError || !authData.user) {
      logger.warn(`⚠️ Login fallido para: ${email}`)
      logger.error('❌ Error de autenticación:', authError?.message)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Credenciales incorrectas',
          remaining: remaining - 1
        },
        { status: 401 }
      )
    }

    logger.log(`✅ Autenticación exitosa para: ${email}`)

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, rol, nombre, apellidos, email, activo')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      logger.error('❌ Error al obtener perfil:', profileError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al cargar perfil de usuario'
        },
        { status: 500 }
      )
    }

    // Verificar que el usuario esté activo
    if (!profile.activo) {
      logger.warn(`⚠️ Usuario inactivo intentó login: ${email}`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuario desactivado. Contacta al administrador.'
        },
        { status: 403 }
      )
    }

    // Login exitoso - Limpiar rate limit
    clearRateLimit(rateLimitKey)

    logger.success(`✅ Login exitoso: ${email} (${profile.rol})`)
    logger.log(`👤 Usuario: ${profile.nombre} ${profile.apellidos}`)

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
        created_at: authData.user.created_at
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in
      },
      profile: {
        id: profile.id,
        rol: profile.rol,
        nombre: profile.nombre,
        apellidos: profile.apellidos,
        email: profile.email
      }
    })

  } catch (error) {
    logger.error('💥 Error inesperado en login:', error)
    logger.error('💥 Stack trace:', error.stack)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error inesperado al iniciar sesión. Intenta nuevamente.'
      },
      { status: 500 }
    )
  }
}