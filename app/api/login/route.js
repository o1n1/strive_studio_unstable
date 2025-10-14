import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkRateLimit, clearRateLimit, getClientIP } from '@/lib/utils/rateLimit'
import { logger } from '@/lib/utils/logger'
import { validateEmail } from '@/lib/validations'

const MAX_LOGIN_ATTEMPTS = 10

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

    const body = await request.json()
    const { email, password } = body

    // Validar campos requeridos
    if (!email || !password) {
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
        { success: false, error: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.' },
        { status: 429 }
      )
    }
    
    logger.log(`✅ Rate limit OK - Intentos restantes: ${remaining}`)

    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    )

    // Intentar login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      logger.error('❌ Error de login:', authError.message)
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'No se pudo iniciar sesión' },
        { status: 401 }
      )
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      logger.error('❌ Error obteniendo perfil:', profileError)
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      )
    }

    logger.success('Login exitoso - Usuario:', authData.user.id, 'Rol:', profile.rol)

    // Limpiar rate limit en login exitoso
    clearRateLimit(rateLimitKey)

    return NextResponse.json({
      success: true,
      user: authData.user,
      profile: profile,
      session: authData.session
    })

  } catch (error) {
    logger.error('💥 Error en login:', error)
    return NextResponse.json(
      { success: false, error: 'Error inesperado al iniciar sesión' },
      { status: 500 }
    )
  }
}