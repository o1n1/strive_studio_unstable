import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/auth/api-auth'
import { logger } from '@/lib/utils/logger'
import { validateEmail, validatePhone } from '@/lib/validations'

/**
 * API para verificar disponibilidad de email y teléfono
 * Endpoint PÚBLICO - No requiere autenticación
 * 
 * @route POST /api/check-availability
 * @access Public
 */
export async function POST(request) {
  logger.log('🔵 Endpoint /api/check-availability llamado')

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
    const { email, telefono } = body

    logger.log('📋 Verificando disponibilidad:')
    if (email) logger.log('  - Email:', email)
    if (telefono) logger.log('  - Teléfono:', telefono)

    // Validar que al menos uno de los campos esté presente
    if (!email && !telefono) {
      logger.error('❌ Ningún campo proporcionado')
      return NextResponse.json(
        { success: false, error: 'Debes proporcionar email o teléfono para verificar' },
        { status: 400 }
      )
    }

    // Validar formato de email si se proporciona
    if (email && !validateEmail(email)) {
      logger.warn('⚠️ Email con formato inválido:', email)
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Validar formato de teléfono si se proporciona
    if (telefono && !validatePhone(telefono)) {
      logger.warn('⚠️ Teléfono con formato inválido:', telefono)
      return NextResponse.json(
        { success: false, error: 'Formato de teléfono inválido' },
        { status: 400 }
      )
    }

    // Crear cliente Supabase con Service Role
    const supabase = createServiceClient()

    // Preparar resultados
    const results = {}

    // Verificar email si se proporciona
    if (email) {
      const emailNormalizado = email.toLowerCase().trim()
      
      // Verificar en tabla profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', emailNormalizado)
        .maybeSingle()

      if (profileError) {
        logger.error('❌ Error al verificar email en profiles:', profileError)
        return NextResponse.json(
          { success: false, error: 'Error al verificar disponibilidad de email' },
          { status: 500 }
        )
      }

      results.emailDisponible = !profileData
      results.emailMensaje = profileData ? 'Email ya está registrado' : 'Email disponible'
      
      if (profileData) {
        logger.log(`⚠️ Email ${emailNormalizado} ya registrado`)
      } else {
        logger.log(`✅ Email ${emailNormalizado} disponible`)
      }
    }

    // Verificar teléfono si se proporciona
    if (telefono) {
      const telefonoNormalizado = telefono.replace(/\s+/g, '').trim()
      
      // Verificar en tabla profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, telefono')
        .eq('telefono', telefonoNormalizado)
        .maybeSingle()

      if (profileError) {
        logger.error('❌ Error al verificar teléfono en profiles:', profileError)
        return NextResponse.json(
          { success: false, error: 'Error al verificar disponibilidad de teléfono' },
          { status: 500 }
        )
      }

      results.telefonoDisponible = !profileData
      results.telefonoMensaje = profileData ? 'Teléfono ya está registrado' : 'Teléfono disponible'
      
      if (profileData) {
        logger.log(`⚠️ Teléfono ${telefonoNormalizado} ya registrado`)
      } else {
        logger.log(`✅ Teléfono ${telefonoNormalizado} disponible`)
      }
    }

    logger.log('✅ Verificación completada:', results)

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error) {
    logger.error('💥 Error inesperado en check-availability:', error)
    logger.error('💥 Stack trace:', error.stack)
    
    return NextResponse.json(
      { success: false, error: 'Error inesperado al verificar disponibilidad' },
      { status: 500 }
    )
  }
}