import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * API para actualizar perfil de coach
 * Maneja campos editables vs protegidos según estado del coach
 * Registra cambios en historial
 */
export async function POST(request) {
  try {
    console.log('📝 [UPDATE PROFILE] Iniciando actualización de perfil...')

    // Autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

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

    // Verificar usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { coachId, formData } = await request.json()

    console.log('📝 [UPDATE PROFILE] Coach ID:', coachId)
    console.log('📝 [UPDATE PROFILE] User ID:', user.id)

    // Verificar que el usuario es el coach o es admin
    let isAdmin = false
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profile?.rol === 'admin') {
      isAdmin = true
      console.log('✅ [UPDATE PROFILE] Usuario es admin')
    } else if (user.id !== coachId) {
      return NextResponse.json(
        { error: 'No autorizado - Solo puedes editar tu propio perfil' },
        { status: 403 }
      )
    }

    // Obtener estado actual del coach
    const { data: coachActual, error: coachError } = await supabase
      .from('coaches')
      .select('estado, id')
      .eq('id', coachId)
      .single()

    if (coachError || !coachActual) {
      return NextResponse.json(
        { error: 'Coach no encontrado' },
        { status: 404 }
      )
    }

    console.log('📝 [UPDATE PROFILE] Estado del coach:', coachActual.estado)

    // Definir campos editables según estado
    const camposEditablesPendiente = [
      'nombre', 'apellidos', 'telefono', 'fecha_nacimiento', 
      'direccion', 'rfc', 'contacto_emergencia', 'bio',
      'años_experiencia', 'instagram', 'facebook', 'tiktok'
    ]

    const camposEditablesActivo = [
      'bio', 'instagram', 'facebook', 'tiktok', 
      'telefono', 'direccion', 'contacto_emergencia'
    ]

    const camposProtegidos = [
      'nombre', 'apellidos', 'fecha_nacimiento', 'rfc', 'años_experiencia'
    ]

    // Determinar qué campos puede editar
    const camposPermitidos = coachActual.estado === 'pendiente' 
      ? camposEditablesPendiente 
      : isAdmin 
        ? camposEditablesPendiente 
        : camposEditablesActivo

    console.log('📝 [UPDATE PROFILE] Campos permitidos:', camposPermitidos)

    // Separar datos para profile y coaches
    const profileUpdates = {}
    const coachUpdates = {}
    const cambiosSolicitados = []

    for (const [key, value] of Object.entries(formData)) {
      // Verificar si el campo está permitido
      if (camposPermitidos.includes(key)) {
        // Campos que van a profiles
        if (['nombre', 'apellidos', 'telefono'].includes(key)) {
          profileUpdates[key] = value
        } 
        // Campos que van a coaches
        else {
          coachUpdates[key] = value
        }
      } else if (camposProtegidos.includes(key) && !isAdmin) {
        // Campo protegido - guardar como cambio solicitado
        cambiosSolicitados.push({
          campo: key,
          valor_anterior: coachActual[key] || null,
          valor_nuevo: value,
          estado: 'pendiente'
        })
        console.log(`⚠️ [UPDATE PROFILE] Campo protegido solicitado: ${key}`)
      }
    }

    // Si hay cambios solicitados (coach activo editando campos protegidos)
    if (cambiosSolicitados.length > 0 && !isAdmin) {
      console.log('📋 [UPDATE PROFILE] Guardando cambios solicitados...')
      
      // Guardar en tabla de cambios solicitados (la crearemos después)
      const { error: cambiosError } = await supabase
        .from('coach_change_requests')
        .insert({
          coach_id: coachId,
          cambios: cambiosSolicitados,
          estado: 'pendiente',
          solicitado_por: user.id
        })

      if (cambiosError) {
        console.error('❌ [UPDATE PROFILE] Error guardando cambios solicitados:', cambiosError)
      }

      // Notificar admin (opcional - implementar después)
      // await notificarAdminCambiosSolicitados(coachId, cambiosSolicitados)
    }

    // Actualizar profiles si hay cambios
    if (Object.keys(profileUpdates).length > 0) {
      console.log('📝 [UPDATE PROFILE] Actualizando profiles...')
      profileUpdates.updated_at = new Date().toISOString()

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', coachId)

      if (profileError) {
        console.error('❌ [UPDATE PROFILE] Error actualizando profile:', profileError)
        throw new Error('Error actualizando información personal')
      }
      console.log('✅ [UPDATE PROFILE] Profile actualizado')
    }

    // Actualizar coaches si hay cambios
    if (Object.keys(coachUpdates).length > 0) {
      console.log('📝 [UPDATE PROFILE] Actualizando coaches...')
      coachUpdates.updated_at = new Date().toISOString()

      const { error: coachUpdateError } = await supabase
        .from('coaches')
        .update(coachUpdates)
        .eq('id', coachId)

      if (coachUpdateError) {
        console.error('❌ [UPDATE PROFILE] Error actualizando coach:', coachUpdateError)
        throw new Error('Error actualizando información profesional')
      }
      console.log('✅ [UPDATE PROFILE] Coach actualizado')
    }

    // Registrar en historial de cambios
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'coach_profile_updated',
        details: {
          coach_id: coachId,
          profile_updates: profileUpdates,
          coach_updates: coachUpdates,
          cambios_solicitados: cambiosSolicitados.length
        }
      })

    const response = {
      success: true,
      message: 'Perfil actualizado exitosamente',
      cambios_aplicados: Object.keys(profileUpdates).length + Object.keys(coachUpdates).length,
      cambios_pendientes: cambiosSolicitados.length
    }

    if (cambiosSolicitados.length > 0) {
      response.message = 'Cambios guardados. Los cambios en campos protegidos están pendientes de aprobación.'
    }

    console.log('✅ [UPDATE PROFILE] Actualización completada')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [UPDATE PROFILE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar perfil' },
      { status: 500 }
    )
  }
}
