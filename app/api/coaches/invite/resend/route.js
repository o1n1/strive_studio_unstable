import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'
import { sendCoachInvitationEmail } from '@/lib/email-templates/coach-invitation'

/**
 * API para reenviar invitaciones de coaches
 * Solo accesible por administradores
 * 
 * @route POST /api/coaches/invite/resend
 * @access Admin
 */
export const POST = withAuth(
  async (request, { user, profile, supabase }) => {
    try {
      console.log(`🔵 [API] Admin ${profile.nombre} ${profile.apellidos} reenviando invitación...`)

      // Obtener ID de invitación del body
      const { invitationId } = await request.json()

      if (!invitationId) {
        console.error('❌ [API] ID de invitación no proporcionado')
        return NextResponse.json(
          { error: 'ID de invitación requerido' },
          { status: 400 }
        )
      }

      console.log('🔵 [API] Reenviando invitación ID:', invitationId)

      // Obtener invitación
      const { data: invitacion, error: fetchError } = await supabase
        .from('coach_invitations')
        .select('*')
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

      // Verificar que la invitación esté pendiente
      if (invitacion.estado !== 'pendiente') {
        console.error('❌ [API] Invitación no está pendiente, estado:', invitacion.estado)
        return NextResponse.json(
          { error: `No se puede reenviar una invitación con estado: ${invitacion.estado}` },
          { status: 400 }
        )
      }

      // Verificar si la invitación ha expirado
      const ahora = new Date()
      const expiracion = new Date(invitacion.expira_en)

      if (expiracion < ahora) {
        console.error('❌ [API] Invitación expirada')
        return NextResponse.json(
          { error: 'Esta invitación ha expirado. Crea una nueva invitación.' },
          { status: 400 }
        )
      }

      // Calcular días restantes
      const diasRestantes = Math.ceil(
        (expiracion - ahora) / (1000 * 60 * 60 * 24)
      )

      console.log('🔵 [API] Días restantes de vigencia:', diasRestantes)

      // Generar URL de invitación
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const inviteUrl = `${baseUrl}/onboarding/coach/${invitacion.token}`

      console.log('📧 [API] URL de invitación:', inviteUrl)

      // Reenviar email
      console.log('📧 [API] Reenviando email a:', invitacion.email)
      
      try {
        const emailResult = await sendCoachInvitationEmail({
          to: invitacion.email,
          categoria: invitacion.categoria,
          inviteUrl,
          expiraDias: diasRestantes,
          mensajePersonalizado: invitacion.mensaje_personalizado
        })

        console.log('✅ [API] Email reenviado exitosamente:', emailResult.emailId)

        return NextResponse.json({
          success: true,
          message: 'Invitación reenviada exitosamente',
          diasRestantes,
          invitation: {
            id: invitacion.id,
            email: invitacion.email,
            categoria: invitacion.categoria,
            expira_en: invitacion.expira_en
          }
        })

      } catch (emailError) {
        console.error('❌ [API] Error al reenviar email:', emailError)
        console.error('❌ [API] Stack trace:', emailError.stack)
        return NextResponse.json(
          { error: 'Error al enviar el email. Verifica la configuración de email: ' + emailError.message },
          { status: 500 }
        )
      }

    } catch (error) {
      console.error('❌ [API] Error general en POST /api/coaches/invite/resend:', error)
      console.error('❌ [API] Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error interno del servidor: ' + error.message },
        { status: 500 }
      )
    }
  },
  { allowedRoles: ['admin'] }
)