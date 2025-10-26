import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'

/**
 * API para cancelar invitaciones de coaches
 * Solo accesible por administradores
 * 
 * @route POST /api/coaches/invite/cancel
 * @access Admin
 */
export const POST = withAuth(
  async (request, { user, profile, supabase }) => {
    try {
      console.log(`🔵 [API] Admin ${profile.nombre} ${profile.apellidos} cancelando invitación...`)

      // Obtener ID de invitación
      const { invitationId } = await request.json()

      if (!invitationId) {
        console.error('❌ [API] ID de invitación no proporcionado')
        return NextResponse.json(
          { error: 'ID de invitación requerido' },
          { status: 400 }
        )
      }

      console.log('🔵 [API] Cancelando invitación ID:', invitationId)

      // Verificar que la invitación existe
      const { data: invitacion, error: fetchError } = await supabase
        .from('coach_invitations')
        .select('id, estado, email, categoria')
        .eq('id', invitationId)
        .single()

      if (fetchError || !invitacion) {
        console.error('❌ [API] Invitación no encontrada:', fetchError)
        return NextResponse.json(
          { error: 'Invitación no encontrada' },
          { status: 404 }
        )
      }

      console.log('🔵 [API] Invitación encontrada:')
      console.log('  - Email:', invitacion.email)
      console.log('  - Categoría:', invitacion.categoria)
      console.log('  - Estado:', invitacion.estado)

      // Solo cancelar si está pendiente
      if (invitacion.estado !== 'pendiente') {
        console.error('❌ [API] Invitación no está pendiente, estado:', invitacion.estado)
        return NextResponse.json(
          { error: 'Solo se pueden cancelar invitaciones pendientes' },
          { status: 400 }
        )
      }

      // Cancelar invitación
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
          { error: 'Error al cancelar la invitación: ' + updateError.message },
          { status: 500 }
        )
      }

      console.log('✅ [API] Invitación cancelada exitosamente')

      return NextResponse.json({
        success: true,
        message: 'Invitación cancelada exitosamente',
        invitation: {
          id: invitacion.id,
          email: invitacion.email,
          categoria: invitacion.categoria
        }
      })

    } catch (error) {
      console.error('❌ [API] Error general en POST /api/coaches/invite/cancel:', error)
      console.error('❌ [API] Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error interno del servidor: ' + error.message },
        { status: 500 }
      )
    }
  },
  { allowedRoles: ['admin'] }
)