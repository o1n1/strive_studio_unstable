import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'
import { sendCoachInvitationEmail } from '@/lib/email-templates/coach-invitation'

/**
 * API para crear nuevas invitaciones de coaches
 * Solo accesible por administradores
 * 
 * @route POST /api/coaches/invite
 * @access Admin
 */
export const POST = withAuth(
  async (request, { user, profile, supabase }) => {
    console.log(`🔵 [API] Admin ${profile.nombre} ${profile.apellidos} creando invitación...`)
    
    try {
      // Obtener datos del body
      const { email, categoria, mensaje, diasExpiracion = 7 } = await request.json()

      console.log('🔵 [API] Datos de invitación:')
      console.log('  - Email:', email)
      console.log('  - Categoría:', categoria)
      console.log('  - Días expiración:', diasExpiracion)

      // Validaciones
      if (!email || !categoria) {
        console.error('❌ [API] Faltan campos requeridos')
        return NextResponse.json(
          { error: 'Email y categoría son requeridos' },
          { status: 400 }
        )
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        console.error('❌ [API] Email inválido:', email)
        return NextResponse.json(
          { error: 'Formato de email inválido' },
          { status: 400 }
        )
      }

      // Validar categoría
      const categoriasValidas = ['cycling', 'boxing', 'funcional', 'yoga', 'pilates']
      if (!categoriasValidas.includes(categoria)) {
        console.error('❌ [API] Categoría inválida:', categoria)
        return NextResponse.json(
          { error: 'Categoría inválida' },
          { status: 400 }
        )
      }

      // Verificar si ya existe una invitación pendiente para este email
      const { data: existingInvitation } = await supabase
        .from('coach_invitations')
        .select('id, estado')
        .eq('email', email)
        .eq('estado', 'pendiente')
        .single()

      if (existingInvitation) {
        console.warn('⚠️ [API] Ya existe una invitación pendiente para este email')
        return NextResponse.json(
          { error: 'Ya existe una invitación pendiente para este email. Cancélala primero si deseas crear una nueva.' },
          { status: 409 }
        )
      }

      // Generar token único
      const token = crypto.randomUUID()
      
      // Calcular fecha de expiración
      const expiraEn = new Date()
      expiraEn.setDate(expiraEn.getDate() + diasExpiracion)

      console.log('🔵 [API] Token generado:', token.substring(0, 20) + '...')
      console.log('🔵 [API] Expira en:', expiraEn.toISOString())

      // Crear invitación en la base de datos
      const { data: invitacion, error: insertError } = await supabase
        .from('coach_invitations')
        .insert({
          email: email.toLowerCase().trim(),
          categoria,
          token,
          expira_en: expiraEn.toISOString(),
          estado: 'pendiente',
          mensaje_personalizado: mensaje || null,
          invitado_por: user.id
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ [API] Error al crear invitación:', insertError)
        return NextResponse.json(
          { error: 'Error al crear la invitación: ' + insertError.message },
          { status: 500 }
        )
      }

      console.log('✅ [API] Invitación creada con ID:', invitacion.id)

      // Generar URL de invitación
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const inviteUrl = `${baseUrl}/onboarding/coach/${token}`

      console.log('📧 [API] URL de invitación:', inviteUrl)

      // Enviar email de invitación
      console.log('📧 [API] Enviando email...')
      try {
        const emailResult = await sendCoachInvitationEmail({
          to: email,
          categoria,
          inviteUrl,
          expiraDias: diasExpiracion,
          mensajePersonalizado: mensaje
        })
        
        console.log('✅ [API] Email enviado exitosamente:', emailResult.emailId)
      } catch (emailError) {
        console.error('❌ [API] Error al enviar email:', emailError)
        console.error('❌ [API] Stack trace:', emailError.stack)
        // No fallamos la invitación si el email falla
        // El admin puede reenviar manualmente
        console.warn('⚠️ [API] Invitación creada pero email falló - Admin puede reenviar')
      }

      console.log('✅ [API] Proceso completado exitosamente')

      return NextResponse.json({
        success: true,
        message: 'Invitación creada y enviada exitosamente',
        invitation: {
          id: invitacion.id,
          email: invitacion.email,
          categoria: invitacion.categoria,
          expira_en: invitacion.expira_en,
          token: invitacion.token,
          inviteUrl
        }
      })

    } catch (error) {
      console.error('❌ [API] Error general en POST /api/coaches/invite:', error)
      console.error('❌ [API] Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error interno del servidor: ' + error.message },
        { status: 500 }
      )
    }
  },
  { allowedRoles: ['admin'] }
)

/**
 * API para reenviar invitaciones existentes
 * Solo accesible por administradores
 * 
 * @route PUT /api/coaches/invite
 * @access Admin
 */
export const PUT = withAuth(
  async (request, { user, profile, supabase }) => {
    console.log(`🔵 [API] Admin ${profile.nombre} ${profile.apellidos} reenviando invitación...`)
    
    try {
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

      // Reenviar email
      console.log('📧 [API] Reenviando email a:', invitacion.email)
      
      try {
        await sendCoachInvitationEmail({
          to: invitacion.email,
          categoria: invitacion.categoria,
          inviteUrl,
          expiraDias: diasRestantes,
          mensajePersonalizado: invitacion.mensaje_personalizado
        })

        console.log('✅ [API] Email reenviado exitosamente')

        return NextResponse.json({
          success: true,
          message: 'Invitación reenviada exitosamente',
          diasRestantes
        })

      } catch (emailError) {
        console.error('❌ [API] Error al reenviar email:', emailError)
        return NextResponse.json(
          { error: 'Error al enviar el email. Verifica la configuración de email.' },
          { status: 500 }
        )
      }

    } catch (error) {
      console.error('❌ [API] Error general en PUT /api/coaches/invite:', error)
      console.error('❌ [API] Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error interno del servidor: ' + error.message },
        { status: 500 }
      )
    }
  },
  { allowedRoles: ['admin'] }
)