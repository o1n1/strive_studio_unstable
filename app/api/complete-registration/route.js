import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/utils/rateLimit'
import { logger } from '@/lib/utils/logger'
import { validateEmail, validatePhone } from '@/lib/validations'

const MAX_REGISTRATION_ATTEMPTS = 5

export async function POST(request) {
  logger.log('🔵 Endpoint /api/complete-registration llamado')

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

  try {
    // Validar Content-Type
    if (!request.headers.get('content-type')?.includes('application/json')) {
      logger.error('❌ Content-Type inválido')
      return NextResponse.json(
        { success: false, error: 'Content-Type inválido' },
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
        { success: false, error: 'Formato de teléfono inválido (10 dígitos requeridos)' },
        { status: 400 }
      )
    }

    if (!validatePhone(emergenciaTelefono)) {
      logger.error('❌ Teléfono de emergencia con formato inválido')
      return NextResponse.json(
        { success: false, error: 'Formato de teléfono de emergencia inválido (10 dígitos requeridos)' },
        { status: 400 }
      )
    }

    // Validar longitud de strings
    if (nombre.trim().length < 2 || apellidos.trim().length < 2) {
      logger.error('❌ Nombre o apellidos muy cortos')
      return NextResponse.json(
        { success: false, error: 'Nombre y apellidos deben tener al menos 2 caracteres' },
        { status: 400 }
      )
    }

    if (emergenciaNombre.trim().length < 2) {
      logger.error('❌ Nombre de emergencia muy corto')
      return NextResponse.json(
        { success: false, error: 'Nombre de contacto de emergencia debe tener al menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      logger.error('❌ userId inválido')
      return NextResponse.json(
        { success: false, error: 'userId inválido' },
        { status: 400 }
      )
    }

    // Sanitizar strings (máximo 255 caracteres)
    const sanitize = (str) => str.trim().slice(0, 255)

    logger.log('🔑 Verificando credenciales...')

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error('❌ Variables de entorno faltantes')
      return NextResponse.json(
        { success: false, error: 'Configuración del servidor incompleta' },
        { status: 500 }
      )
    }

    // Crear cliente de Supabase con Service Role Key
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

    logger.log('✅ Cliente Supabase creado')

    // 🚀 MEJORA: Llamar a función RPC con transacción atómica
    logger.log('📝 Ejecutando registro con transacción atómica...')

    const { data: result, error: rpcError } = await supabase.rpc(
      'complete_user_registration',
      {
        p_user_id: userId,
        p_email: sanitize(email),
        p_nombre: sanitize(nombre),
        p_apellidos: sanitize(apellidos),
        p_telefono: sanitize(telefono),
        p_emergencia_nombre: sanitize(emergenciaNombre),
        p_emergencia_telefono: sanitize(emergenciaTelefono),
        p_alergias: alergias ? sanitize(alergias) : null,
        p_lesiones: lesiones ? sanitize(lesiones) : null,
        p_ip_address: ip,
        p_user_agent: userAgent || null
      }
    )

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
    return NextResponse.json(
      { success: false, error: 'Error inesperado al completar el registro' },
      { status: 500 }
    )
  }
}