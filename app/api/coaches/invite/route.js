import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendCoachInvitationEmail } from '@/lib/email-templates/coach-invitation'

export async function POST(request) {
  try {
    console.log('🔍 [API] Iniciando POST /api/coaches/invite')
    
    // Obtener token del header Authorization
    const authHeader = request.headers.get('authorization')
    console.log('🔍 [API] Authorization header:', authHeader ? 'Presente' : 'FALTANTE')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [API] Token faltante o formato incorrecto')
      return NextResponse.json(
        { error: 'No autenticado - Token faltante' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔍 [API] Token extraído (primeros 20 chars):', token.substring(0, 20) + '...')

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
    
    console.log('🔍 [API] Cliente Supabase creado')
    
    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 [API] Usuario:', user ? user.id : 'NULL')
    console.log('🔍 [API] Auth error:', authError ? authError.message : 'NONE')
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo admins pueden invitar coaches.' },
        { status: 403 }
      )
    }

    // Obtener datos del body
    const { email, categoria, expiracion, mensaje } = await request.json()

    // Validaciones
    if (!email || !categoria) {
      return NextResponse.json(
        { error: 'Email y categoría son requeridos' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    if (!['cycling', 'funcional', 'ambos'].includes(categoria)) {
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe en profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Este email ya está registrado en el sistema' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una invitación pendiente con este email
    const { data: existingInvitation } = await supabase
      .from('coach_invitations')
      .select('id, estado')
      .eq('email', email.toLowerCase())
      .eq('estado', 'pendiente')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este email' },
        { status: 400 }
      )
    }

    // Calcular fecha de expiración
    const diasExpiracion = parseInt(expiracion) || 7
    const fechaExpiracion = new Date()
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion)

    // Crear invitación en la base de datos
    const { data: invitacion, error: inviteError } = await supabase
      .from('coach_invitations')
      .insert({
        email: email.toLowerCase(),
        categoria,
        estado: 'pendiente',
        expira_en: fechaExpiracion.toISOString(),
        invitado_por: user.id,
        mensaje_personalizado: mensaje || null
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error al crear invitación:', inviteError)
      return NextResponse.json(
        { error: 'Error al crear la invitación' },
        { status: 500 }
      )
    }

    // Generar URL de invitación
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/onboarding/coach/${invitacion.token}`

    // Enviar email
    try {
      await sendCoachInvitationEmail({
        to: email,
        categoria,
        inviteUrl,
        expiraDias: diasExpiracion,
        mensajePersonalizado: mensaje
      })
    } catch (emailError) {
      console.error('Error al enviar email:', emailError)
      // No fallamos la invitación si el email falla
      // El admin puede reenviar manualmente
    }

    return NextResponse.json({
      success: true,
      message: 'Invitación creada y enviada exitosamente',
      invitation: {
        id: invitacion.id,
        email: invitacion.email,
        categoria: invitacion.categoria,
        expira_en: invitacion.expira_en,
        inviteUrl
      }
    })

  } catch (error) {
    console.error('Error en POST /api/coaches/invite:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// API para reenviar invitación
export async function PUT(request) {
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autenticado - Token faltante' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

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
    console.error('Error en PUT /api/coaches/invite:', error)
    return NextResponse.json(
      { error: 'Error al reenviar invitación' },
      { status: 500 }
    )
  }
}
