import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('🔍 [API] Iniciando POST /api/coaches/invite/cancel')
    
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

    console.log('🔍 [API] Cancelando invitación:', invitationId)

    // Actualizar estado de invitación a cancelado
    const { error: updateError } = await supabase
      .from('coach_invitations')
      .update({ 
        estado: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('❌ [API] Error al cancelar invitación:', updateError)
      return NextResponse.json(
        { error: 'Error al cancelar la invitación' },
        { status: 500 }
      )
    }

    console.log('✅ [API] Invitación cancelada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Invitación cancelada exitosamente'
    })

  } catch (error) {
    console.error('❌ [API] Error en POST /api/coaches/invite/cancel:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
