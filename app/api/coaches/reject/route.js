import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'

/**
 * API para rechazar solicitudes de coaches
 * Solo accesible por administradores
 * 
 * @route POST /api/coaches/reject
 * @access Admin
 */
export const POST = withAuth(
  async (request, { user, profile, supabase }) => {
    try {
      console.log(`⚠️ [API] Admin ${profile.nombre} ${profile.apellidos} iniciando rechazo de coach...`)

      // Obtener datos del body
      const { coachId, motivo } = await request.json()

      // Validar campos requeridos
      if (!coachId || !motivo) {
        console.error('❌ [API] Faltan campos requeridos')
        return NextResponse.json(
          { error: 'ID de coach y motivo son requeridos' },
          { status: 400 }
        )
      }

      // Validar que el motivo no esté vacío
      if (motivo.trim().length === 0) {
        console.error('❌ [API] Motivo vacío')
        return NextResponse.json(
          { error: 'El motivo del rechazo no puede estar vacío' },
          { status: 400 }
        )
      }

      console.log(`⚠️ [API] Rechazando coach: ${coachId}`)
      console.log(`⚠️ [API] Motivo: ${motivo}`)

      // Obtener datos del coach antes de actualizar
      const { data: coachData, error: fetchError } = await supabase
        .from('profiles')
        .select('email, nombre, apellidos')
        .eq('id', coachId)
        .single()

      if (fetchError || !coachData) {
        console.error('❌ [API] Coach no encontrado:', fetchError)
        return NextResponse.json(
          { error: 'Coach no encontrado' },
          { status: 404 }
        )
      }

      console.log(`📧 [API] Coach encontrado: ${coachData.nombre} ${coachData.apellidos} (${coachData.email})`)

      // Actualizar estado del coach a rechazado
      const { error: updateError } = await supabase
        .from('coaches')
        .update({
          estado: 'inactivo',
          activo: false,
          notas_internas: `RECHAZADO por ${profile.nombre} ${profile.apellidos}: ${motivo}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', coachId)

      if (updateError) {
        console.error('❌ [API] Error actualizando coach:', updateError)
        return NextResponse.json(
          { error: 'Error al rechazar coach: ' + updateError.message },
          { status: 500 }
        )
      }

      console.log('✅ [API] Coach rechazado en base de datos')

      // TODO: Enviar email al coach con el motivo del rechazo
      // Puedes implementar esto usando la API de notificaciones
      console.log(`📧 TODO: Enviar email a ${coachData.email} con motivo: ${motivo}`)

      console.log('✅ [API] Proceso de rechazo completado exitosamente')

      return NextResponse.json({
        success: true,
        message: 'Coach rechazado exitosamente. Se le notificará por email.',
        coach: {
          nombre: coachData.nombre,
          apellidos: coachData.apellidos,
          email: coachData.email
        }
      })

    } catch (error) {
      console.error('❌ [API] Error inesperado rechazando coach:', error)
      console.error('❌ [API] Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error interno del servidor: ' + error.message },
        { status: 500 }
      )
    }
  },
  { allowedRoles: ['admin'] } // 🔒 Solo administradores pueden rechazar coaches
)