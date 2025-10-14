import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/utils/rateLimit'
import { logger } from '@/lib/utils/logger'
import { validateEmail, validatePhone } from '@/lib/validations'

const MAX_REGISTRATION_ATTEMPTS = 5

export async function POST(request) {
  logger.log('🔵 Endpoint /api/complete-registration llamado')

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

    const { userId, email, nombre, apellidos, telefono, emergenciaNombre, emergenciaTelefono, alergias, lesiones, userAgent } = body

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

    // Sanitizar strings
    const sanitize = (str) => str.trim().slice(0, 255)

    logger.log('🔑 Verificando credenciales...')
    logger.log('URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    logger.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

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

    // 1. Crear perfil
    logger.log('📝 Insertando perfil...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: sanitize(email),
        nombre: sanitize(nombre),
        apellidos: sanitize(apellidos),
        telefono: sanitize(telefono),
        rol: 'cliente',
        activo: true,
        require_email_verification: true
      })

    if (profileError) {
      logger.error('❌ Error insertando perfil:', profileError)
      throw profileError
    }
    logger.success('Perfil insertado')

    // 2. Crear datos de salud
    logger.log('📝 Insertando datos de salud...')
    const { data: healthData, error: healthError } = await supabase
      .from('client_health_data')
      .insert({
        user_id: userId,
        emergencia_nombre: sanitize(emergenciaNombre),
        emergencia_telefono: sanitize(emergenciaTelefono),
        alergias: sanitize(alergias || ''),
        lesiones: sanitize(lesiones || '')
      })

    if (healthError) {
      logger.error('❌ Error insertando datos de salud:', healthError)
      throw healthError
    }
    logger.success('Datos de salud insertados')

    // 3. Crear aceptación legal
    logger.log('📝 Insertando aceptación legal...')
    const { data: legalData, error: legalError } = await supabase
      .from('user_legal_acceptances')
      .insert({
        user_id: userId,
        accepted_at: new Date().toISOString(),
        user_agent: sanitize(userAgent || '')
      })

    if (legalError) {
      logger.error('❌ Error insertando aceptación legal:', legalError)
      throw legalError
    }
    logger.success('Aceptación legal insertada')

    logger.success('🎉 Registro completado exitosamente')
    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('💥 Error completo:', error)
    logger.error('Error message:', error.message)
    logger.error('Error details:', error.details)
    logger.error('Error hint:', error.hint)

    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.details,
        hint: error.hint
      },
      { status: 500 }
    )
  }
}