import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendCoachInvitationEmail } from '@/lib/email-templates/coach-invitation'

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
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
        { error: 'No autorizado. Solo admins pueden reenviar invitaciones.' },
        { status: 403 }
      )
    }

    // Obtener ID de invitación
    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json(
        { error: 'ID de invitación requerido' },
        { status: 400 }
      )
    }

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

    // Solo reenviar si está pendiente
    if (invitacion.estado !== 'pendiente') {
      return NextResponse.json(
        { error: 'Solo se pueden reenviar invitaciones pendientes' },
        { status: 400 }
      )
    }

    // Verificar si ya expiró
    const ahora = new Date()
    const expiracion = new Date(invitacion.expira_en)
    
    if (expiracion < ahora) {
      // Marcar como expirada
      await supabase
        .from('coach_invitations')
        .update({ estado: 'expirado' })
        .eq('id', invitacionId)

      return NextResponse.json(
        { error: 'La invitación ha expirado. Crea una nueva invitación.' },
        { status: 400 }
      )
    }

    // Calcular días restantes
    const diasRestantes = Math.ceil(
      (expiracion - ahora) / (1000 * 60 * 60 * 24)
    )

    // Generar URL de invitación
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/onboarding/coach/${invitacion.token}`

    // Reenviar email
    try {
      await sendCoachInvitationEmail({
        to: invitacion.email,
        categoria: invitacion.categoria,
        inviteUrl,
        expiraDias: diasRestantes,
        mensajePersonalizado: invitacion.mensaje_personalizado
      })

      return NextResponse.json({
        success: true,
        message: 'Invitación reenviada exitosamente',
        diasRestantes
      })

    } catch (emailError) {
      console.error('Error al reenviar email:', emailError)
      return NextResponse.json(
        { error: 'Error al enviar el email. Verifica la configuración de email.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error en POST /api/coaches/invite/resend:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
