import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('✅ [API] Iniciando aprobación de coach...')

    // Obtener token del header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Crear cliente con Service Role Key
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

    // Verificar que es admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
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

    const { coachId } = await request.json()

    if (!coachId) {
      return NextResponse.json(
        { error: 'ID de coach requerido' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Aprobando coach:', coachId)

    // Actualizar estado del coach
    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        estado: 'activo',
        activo: true,
        fecha_aprobacion: new Date().toISOString().split('T')[0],
        aprobado_por: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', coachId)

    if (updateError) {
      console.error('❌ Error actualizando coach:', updateError)
      return NextResponse.json(
        { error: 'Error al aprobar coach: ' + updateError.message },
        { status: 500 }
      )
    }

    // TODO: Enviar email de bienvenida al coach
    // TODO: Enviar notificación al equipo

    console.log('✅ [API] Coach aprobado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Coach aprobado exitosamente'
    })

  } catch (error) {
    console.error('❌ [API] Error aprobando coach:', error)
    return NextResponse.json(
      { error: 'Error al aprobar coach: ' + error.message },
      { status: 500 }
    )
  }
}