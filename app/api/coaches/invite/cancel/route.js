import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
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
        { error: 'No autorizado. Solo admins pueden cancelar invitaciones.' },
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

    // Verificar que la invitación existe
    const { data: invitacion, error: fetchError } = await supabase
      .from('coach_invitations')
      .select('id, estado')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitacion) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    // Solo cancelar si está pendiente
    if (invitacion.estado !== 'pendiente') {
      return NextResponse.json(
        { error: 'Solo se pueden cancelar invitaciones pendientes' },
        { status: 400 }
      )
    }

    // Cancelar invitación
    const { error: updateError } = await supabase
      .from('coach_invitations')
      .update({ estado: 'cancelado' })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error al cancelar invitación:', updateError)
      return NextResponse.json(
        { error: 'Error al cancelar la invitación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitación cancelada exitosamente'
    })

  } catch (error) {
    console.error('Error en POST /api/coaches/invite/cancel:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
