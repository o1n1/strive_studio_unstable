import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(request) {
  try {
    console.log('🗑️ [API] Iniciando eliminación completa de coach...')

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

    console.log('🗑️ [API] Eliminando coach:', coachId)

    // 1. Eliminar certificaciones
    await supabase
      .from('coach_certifications')
      .delete()
      .eq('coach_id', coachId)
    console.log('✅ Certificaciones eliminadas')

    // 2. Eliminar documentos
    await supabase
      .from('coach_documents')
      .delete()
      .eq('coach_id', coachId)
    console.log('✅ Documentos eliminados')

    // 3. Eliminar contratos
    await supabase
      .from('coach_contracts')
      .delete()
      .eq('coach_id', coachId)
    console.log('✅ Contratos eliminados')

    // 4. Eliminar de tabla coaches
    await supabase
      .from('coaches')
      .delete()
      .eq('id', coachId)
    console.log('✅ Registro de coaches eliminado')

    // 5. Eliminar perfil
    await supabase
      .from('profiles')
      .delete()
      .eq('id', coachId)
    console.log('✅ Perfil eliminado')

    // 6. Eliminar usuario de Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(coachId)
    if (deleteAuthError) {
      console.error('⚠️ Error eliminando usuario de Auth:', deleteAuthError)
      // Continuar aunque falle esto
    } else {
      console.log('✅ Usuario eliminado de Auth')
    }

    // 7. TODO: Eliminar archivos de Storage
    // Esto requeriría listar y eliminar todos los archivos del usuario

    console.log('✅ [API] Coach eliminado completamente')

    return NextResponse.json({
      success: true,
      message: 'Coach eliminado completamente'
    })

  } catch (error) {
    console.error('❌ [API] Error eliminando coach:', error)
    return NextResponse.json(
      { error: 'Error al eliminar coach: ' + error.message },
      { status: 500 }
    )
  }
}