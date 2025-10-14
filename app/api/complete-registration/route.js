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

    // Verificar que el usuario existe en auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser) {
      logger.error('❌ Usuario no encontrado en auth.users:', authError)
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    logger.log('✅ Usuario verificado en auth.users')

    // Verificar si ya existe el perfil
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      logger.log('⚠️ El perfil ya existe')
      return NextResponse.json({
        success: true,
        message: 'El perfil ya estaba creado'
      })
    }

    // Verificar duplicados de email y teléfono
    const { data: duplicates, error: duplicateError } = await supabase
      .from('profiles')
      .select('email, telefono')
      .or(`email.eq.${email},telefono.eq.${telefono}`)

    if (duplicateError) {
      logger.error('❌ Error verificando duplicados:', duplicateError)
    }

    if (duplicates && duplicates.length > 0) {
      const isDuplicateEmail = duplicates.some(d => d.email === email)
      const isDuplicatePhone = duplicates.some(d => d.telefono === telefono)
      
      if (isDuplicateEmail && isDuplicatePhone) {
        return NextResponse.json(
          { success: false, error: 'Email y teléfono ya registrados' },
          { status: 409 }
        )
      } else if (isDuplicateEmail) {
        return NextResponse.json(
          { success: false, error: 'Email ya registrado' },
          { status: 409 }
        )
      } else if (isDuplicatePhone) {
        return NextResponse.json(
          { success: false, error: 'Teléfono ya registrado' },
          { status: 409 }
        )
      }
    }

    logger.log('📝 Insertando perfil en la base de datos...')

    // Insertar perfil del usuario
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: sanitize(email),
        nombre: sanitize(nombre),
        apellidos: sanitize(apellidos),
        telefono: sanitize(telefono),
        emergencia_nombre: sanitize(emergenciaNombre),
        emergencia_telefono: sanitize(emergenciaTelefono),
        alergias: alergias ? sanitize(alergias) : null,
        lesiones: lesiones ? sanitize(lesiones) : null,
        rol: 'cliente',
        creditos: 0,
        activo: true,
        fecha_registro: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      logger.error('❌ Error insertando perfil:', profileError)
      logger.error('Detalles del error:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      
      return NextResponse.json(
        { success: false, error: `Error al crear el perfil: ${profileError.message}` },
        { status: 500 }
      )
    }

    logger.success('Perfil creado exitosamente:', userId)

    // Log de auditoría
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'user_registered',
        details: {
          email,
          nombre,
          apellidos,
          user_agent: userAgent,
          ip: ip
        },
        ip_address: ip,
        user_agent: userAgent
      })

    if (logError) {
      logger.warn('⚠️ Error guardando log de auditoría:', logError)
    }

    return NextResponse.json({
      success: true,
      profile: profileData
    })

  } catch (error) {
    logger.error('💥 Error inesperado:', error)
    return NextResponse.json(
      { success: false, error: 'Error inesperado al completar el registro' },
      { status: 500 }
    )
  }
}