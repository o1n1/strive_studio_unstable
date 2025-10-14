import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { validateEmail, validatePhone } from '@/lib/validations'

export async function POST(request) {
  logger.log('🔵 Endpoint /api/check-availability llamado')

  try {
    const body = await request.json()
    const { email, telefono } = body

    // Validar que al menos uno de los campos venga
    if (!email && !telefono) {
      return NextResponse.json(
        { success: false, error: 'Email o teléfono requerido' },
        { status: 400 }
      )
    }

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

    const results = {}

    // Verificar email si se proporciona
    if (email) {
      // Validar formato
      if (!validateEmail(email)) {
        return NextResponse.json({
          success: true,
          email: { available: false, reason: 'Formato inválido' }
        })
      }

      // Buscar en base de datos
      const { data: emailExists, error: emailError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (emailError && emailError.code !== 'PGRST116') {
        // PGRST116 = no rows found (que es lo que queremos)
        logger.error('Error verificando email:', emailError)
        return NextResponse.json(
          { success: false, error: 'Error al verificar email' },
          { status: 500 }
        )
      }

      results.email = {
        available: !emailExists,
        reason: emailExists ? 'Ya está registrado' : null
      }
    }

    // Verificar teléfono si se proporciona
    if (telefono) {
      // Validar formato
      if (!validatePhone(telefono)) {
        return NextResponse.json({
          success: true,
          telefono: { available: false, reason: 'Formato inválido (10 dígitos)' }
        })
      }

      // Limpiar teléfono (quitar guiones y espacios)
      const cleanPhone = telefono.replace(/\D/g, '')

      // Buscar en base de datos
      const { data: phoneExists, error: phoneError } = await supabase
        .from('profiles')
        .select('id')
        .eq('telefono', cleanPhone)
        .single()

      if (phoneError && phoneError.code !== 'PGRST116') {
        logger.error('Error verificando teléfono:', phoneError)
        return NextResponse.json(
          { success: false, error: 'Error al verificar teléfono' },
          { status: 500 }
        )
      }

      results.telefono = {
        available: !phoneExists,
        reason: phoneExists ? 'Ya está registrado' : null
      }
    }

    logger.log('✅ Verificación completada:', results)

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error) {
    logger.error('💥 Error en check-availability:', error)
    return NextResponse.json(
      { success: false, error: 'Error inesperado al verificar disponibilidad' },
      { status: 500 }
    )
  }
}