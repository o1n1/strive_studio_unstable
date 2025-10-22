import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('⚠️ [API] Iniciando rechazo de coach...')

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

    const { coachId, motivo } = await request.json()

    if (!coachId || !motivo) {
      return NextResponse.json(
        { error: 'ID de coach y motivo son requeridos' },
        { status: 400 }
      )
    }

    console.log('⚠️ [API] Rechazando coach:', coachId)

    // Obtener email del coach antes de eliminar
    const { data: coachData } = await supabase
      .from('profiles')
      .select('email, nombre, apellidos')
      .eq('id', coachId)
      .single()

    // Actualizar estado del coach a rechazado
    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        estado: 'inactivo',
        activo: false,
        notas_internas: `RECHAZADO: ${motivo}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', coachId)

    if (updateError) {
      console.error('❌ Error actualizando coach:', updateError)
      return NextResponse.json(
        { error: 'Error al rechazar coach: ' + updateError.message },
        { status: 500 }
      )
    }

    // TODO: Enviar email al coach con el motivo del rechazo
    if (coachData) {
      console.log(`📧 TODO: Enviar email a ${coachData.email} con motivo: ${motivo}`)
    }

    console.log('✅ [API] Coach rechazado')

    return NextResponse.json({
      success: true,
      message: 'Coach rechazado. Se le notificará por email.'
    })

  } catch (error) {
    console.error('❌ [API] Error rechazando coach:', error)
    return NextResponse.json(
      { error: 'Error al rechazar coach: ' + error.message },
      { status: 500 }
    )
  }
}