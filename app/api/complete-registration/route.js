import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/auth/api-auth'
import { checkRateLimit, getClientIP } from '@/lib/utils/rateLimit'
import { logger } from '@/lib/utils/logger'
import { validateEmail, validatePhone } from '@/lib/validations'

const MAX_REGISTRATION_ATTEMPTS = 5

/**
 * API para completar el registro de usuario
 * Endpoint PÚBLICO - No requiere autenticación previa
 * Se llama después de que el usuario se registra con email/password
 * 
 * @route POST /api/complete-registration
 * @access Public
 */
export async function POST(request) {
  logger.log('🔵 Endpoint /api/complete-registration llamado')

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

    // 🛡️ VALIDACIÓN DE RATE LIMITING
    const ip = getClientIP(request)
    const { allowed, remaining } = checkRateLimit(ip, MAX_REGISTRATION_ATTEMPTS)
    
    if (!allowed) {
      logger.warn(`⚠️ Rate limit excedido para IP: ${ip}`)
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intenta en 15 minutos.' },
        { status: 429 }
      )
    }
    
    logger.log(`✅ Rate limit OK - Intentos restantes: ${remaining}`)

    // Validar Content-Type
    if (!request.headers.get('content-type')?.includes('application/json')) {
      logger.error('❌ Content-Type inválido')
      return NextResponse.json(
        { success: false, error: 'Content-Type debe ser application/json' },
        { status: 400 }
      )
    }

    const body = await request.json()
    logger.log('📦 Body recibido (datos sensibles ocultos)')

    const { 
      userId, 
      email, 
      nombre, 
      apellidos, 
      telefono, 
      emergenciaNombre, 
      emergenciaTelefono, 
      alergias, 
      lesiones, 
      userAgent 
    } = body

    // Validar campos requeridos
    if (!userId || !email || !nombre || !apellidos || !telefono || !emergenciaNombre || !emergenciaTelefono) {
      logger.error('❌ Faltan campos requeridos')
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // 🛡️ VALIDACIONES DE FORMATO en backend
    if (!validateEmail(email)) {
      logger.error('❌ Email con formato inválido')
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    if (!validatePhone(telefono)) {
      logger.error('❌ Teléfono con formato inválido')
      return NextResponse.json(
        { success: false, error: 'Formato de teléfono inválido' },
        { status: 400 }
      )
    }

    if (!validatePhone(emergenciaTelefono)) {
      logger.error('❌ Teléfono de emergencia con formato inválido')
      return NextResponse.json(
        { success: false, error: 'Formato de teléfono de emergencia inválido' },
        { status: 400 }
      )
    }

    // Validar longitud de campos
    if (nombre.length < 2 || nombre.length > 100) {
      logger.error('❌ Nombre con longitud inválida')
      return NextResponse.json(
        { success: false, error: 'El nombre debe tener entre 2 y 100 caracteres' },
        { status: 400 }
      )
    }

    if (apellidos.length < 2 || apellidos.length > 100) {
      logger.error('❌ Apellidos con longitud inválida')
      return NextResponse.json(
        { success: false, error: 'Los apellidos deben tener entre 2 y 100 caracteres' },
        { status: 400 }
      )
    }

    if (emergenciaNombre.length < 2 || emergenciaNombre.length > 100) {
      logger.error('❌ Nombre de emergencia con longitud inválida')
      return NextResponse.json(
        { success: false, error: 'El nombre de emergencia debe tener entre 2 y 100 caracteres' },
        { status: 400 }
      )
    }

    logger.log('✅ Todas las validaciones pasaron')

    // Crear cliente Supabase con Service Role
    const supabase = createServiceClient()

    // Sanitizar datos para prevenir XSS
    const sanitize = (str) => {
      if (!str) return null
      return str
        .trim()
        .replace(/[<>]/g, '') // Remover < y >
        .substring(0, 500) // Limitar longitud
    }

    logger.log('🔄 Llamando función RPC para completar registro...')

    // Llamar función RPC que maneja la transacción
    const { data: result, error: rpcError } = await supabase
      .rpc('complete_user_registration', {
        p_user_id: userId,
        p_email: email.toLowerCase().trim(),
        p_nombre: sanitize(nombre),
        p_apellidos: sanitize(apellidos),
        p_telefono: telefono.replace(/\s+/g, ''),
        p_emergencia_nombre: sanitize(emergenciaNombre),
        p_emergencia_telefono: emergenciaTelefono.replace(/\s+/g, ''),
        p_alergias: alergias ? sanitize(alergias) : null,
        p_lesiones: lesiones ? sanitize(lesiones) : null,
        p_ip_address: ip,
        p_user_agent: userAgent || null
      })

    if (rpcError) {
      logger.error('❌ Error en RPC function:', rpcError)
      
      // Manejo de errores específicos
      if (rpcError.message.includes('Email ya registrado')) {
        return NextResponse.json(
          { success: false, error: 'Email ya registrado' },
          { status: 409 }
        )
      }
      
      if (rpcError.message.includes('Teléfono ya registrado')) {
        return NextResponse.json(
          { success: false, error: 'Teléfono ya registrado' },
          { status: 409 }
        )
      }

      if (rpcError.message.includes('Usuario no encontrado')) {
        return NextResponse.json(
          { success: false, error: 'Usuario no encontrado en el sistema de autenticación' },
          { status: 404 }
        )
      }

      // Error genérico
      return NextResponse.json(
        { success: false, error: `Error al completar el registro: ${rpcError.message}` },
        { status: 500 }
      )
    }

    // Verificar respuesta de la función
    if (!result || !result.success) {
      logger.error('❌ Función RPC retornó error:', result)
      return NextResponse.json(
        { success: false, error: result?.error || 'Error desconocido al completar el registro' },
        { status: 500 }
      )
    }

    logger.success('✅ Registro completado exitosamente con transacción atómica')
    logger.log('📊 Resultado:', result.message)

    return NextResponse.json({
      success: true,
      message: result.message,
      profile_id: result.profile_id
    })

  } catch (error) {
    logger.error('💥 Error inesperado:', error)
    logger.error('💥 Stack trace:', error.stack)
    
    return NextResponse.json(
      { success: false, error: 'Error inesperado al completar el registro' },
      { status: 500 }
    )
  }
}