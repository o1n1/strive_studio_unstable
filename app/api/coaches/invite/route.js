import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendCoachInvitationEmail } from '@/lib/email-templates/coach-invitation'

export async function POST(request) {
  console.log('🔵 [API] POST /api/coaches/invite - Iniciando...')
  
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('authorization')
    console.log('🔵 [API] Auth header presente:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [API] Token faltante o inválido')
      return NextResponse.json(
        { error: 'No autenticado - Token faltante' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔵 [API] Token extraído (primeros 20 chars):', token.substring(0, 20) + '...')

    // Crear cliente de Supabase con el token del usuario
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    console.log('🔵 [API] Cliente Supabase creado')

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ [API] Error de autenticación:', authError)
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    if (!user) {
      console.error('❌ [API] No hay usuario')
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    console.log('✅ [API] Usuario autenticado:', user.id)

    // Verificar que sea admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ [API] Error al obtener perfil:', profileError)
      return NextResponse.json(
        { error: 'Error al verificar permisos' },
        { status: 500 }
      )
    }

    console.log('🔵 [API] Rol del usuario:', profile?.rol)

    if (!profile || profile.rol !== 'admin') {
      console.error('❌ [API] Usuario no es admin')
      return NextResponse.json(
        { error: 'No autorizado. Solo admins pueden invitar coaches.' },
        { status: 403 }
      )
    }

    console.log('✅ [API] Usuario es admin, continuando...')

    // Obtener datos del body
    const body = await request.json()
    console.log('🔵 [API] Body recibido:', JSON.stringify(body, null, 2))
    
    const { email, categoria, expiracion, mensaje } = body

    // Validaciones
    if (!email || !categoria) {
      console.error('❌ [API] Email o categoría faltante')
      return NextResponse.json(
        { error: 'Email y categoría son requeridos' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('❌ [API] Email inválido:', email)
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    if (!['cycling', 'funcional', 'ambos'].includes(categoria)) {
      console.error('❌ [API] Categoría inválida:', categoria)
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Validaciones pasadas')

    // Verificar si el email ya existe en profiles
    console.log('🔍 [API] Verificando si email existe en profiles...')
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (profileCheckError) {
      console.error('❌ [API] Error verificando email en profiles:', profileCheckError)
    }

    console.log('🔍 [API] Email existe en profiles:', !!existingProfile)

    if (existingProfile) {
      console.error('❌ [API] Email ya registrado:', email)
      return NextResponse.json(
        { error: 'Este email ya está registrado en el sistema' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una invitación pendiente con este email
    console.log('🔍 [API] Verificando invitaciones existentes...')
    const { data: existingInvitation, error: invCheckError } = await supabase
      .from('coach_invitations')
      .select('id, estado')
      .eq('email', email.toLowerCase())
      .eq('estado', 'pendiente')
      .maybeSingle()

    if (invCheckError) {
      console.error('❌ [API] Error verificando invitaciones:', invCheckError)
    }

    console.log('🔍 [API] Invitación pendiente existe:', !!existingInvitation)

    if (existingInvitation) {
      console.error('❌ [API] Ya existe invitación pendiente para:', email)
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este email' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Email disponible, creando invitación...')

    // Calcular fecha de expiración
    const diasExpiracion = parseInt(expiracion) || 7
    const fechaExpiracion = new Date()
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion)

    console.log('🔵 [API] Días de expiración:', diasExpiracion)
    console.log('🔵 [API] Fecha de expiración:', fechaExpiracion.toISOString())

    // Crear invitación en la base de datos
    const invitacionData = {
      email: email.toLowerCase(),
      categoria,
      estado: 'pendiente',
      expira_en: fechaExpiracion.toISOString(),
      invitado_por: user.id,
      mensaje_personalizado: mensaje || null
    }

    console.log('🔵 [API] Datos de invitación:', JSON.stringify(invitacionData, null, 2))

    const { data: invitacion, error: inviteError } = await supabase
      .from('coach_invitations')
      .insert(invitacionData)
      .select()
      .single()

    if (inviteError) {
      console.error('❌ [API] Error al crear invitación en DB:', inviteError)
      console.error('❌ [API] Detalles del error:', JSON.stringify(inviteError, null, 2))
      return NextResponse.json(
        { error: 'Error al crear la invitación: ' + inviteError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Invitación creada en DB:', invitacion.id)
    console.log('✅ [API] Token generado:', invitacion.token)

    // Generar URL de invitación
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/onboarding/coach/${invitacion.token}`

    console.log('🔵 [API] URL de invitación:', inviteUrl)

    // Enviar email
    console.log('📧 [API] Iniciando envío de email...')
    try {
      const emailResult = await sendCoachInvitationEmail({
        to: email,
        categoria,
        inviteUrl,
        expiraDias: diasExpiracion,
        mensajePersonalizado: mensaje
      })
      
      console.log('✅ [API] Email enviado exitosamente:', emailResult.emailId)
    } catch (emailError) {
      console.error('❌ [API] Error al enviar email:', emailError)
      console.error('❌ [API] Stack trace:', emailError.stack)
      // No fallamos la invitación si el email falla
      // El admin puede reenviar manualmente
      console.warn('⚠️ [API] Invitación creada pero email falló - Admin puede reenviar')
    }

    console.log('✅ [API] Proceso completado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Invitación creada y enviada exitosamente',
      invitation: {
        id: invitacion.id,
        email: invitacion.email,
        categoria: invitacion.categoria,
        expira_en: invitacion.expira_en,
        token: invitacion.token,
        inviteUrl
      }
    })

  } catch (error) {
    console.error('❌ [API] Error general en POST /api/coaches/invite:', error)
    console.error('❌ [API] Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    )
  }
}

// API para reenviar invitación (método PUT)
export async function PUT(request) {
  console.log('🔵 [API] PUT /api/coaches/invite - Reenviar invitación...')
  
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autenticado - Token faltante' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { invitationId } = await request.json()

    // Obtener invitación
    const { data: invitacion, error: fetchError } = await supabase
      .from('coach_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitacion) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    if (invitacion.estado !== 'pendiente') {
      return NextResponse.json(
        { error: 'Solo se pueden reenviar invitaciones pendientes' },
        { status: 400 }
      )
    }

    // Reenviar email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/onboarding/coach/${invitacion.token}`

    const diasRestantes = Math.ceil(
      (new Date(invitacion.expira_en) - new Date()) / (1000 * 60 * 60 * 24)
    )

    await sendCoachInvitationEmail({
      to: invitacion.email,
      categoria: invitacion.categoria,
      inviteUrl,
      expiraDias: diasRestantes,
      mensajePersonalizado: invitacion.mensaje_personalizado
    })

    return NextResponse.json({
      success: true,
      message: 'Invitación reenviada exitosamente'
    })

  } catch (error) {
    console.error('❌ [API] Error en PUT /api/coaches/invite:', error)
    return NextResponse.json(
      { error: 'Error al reenviar invitación' },
      { status: 500 }
    )
  }
}
