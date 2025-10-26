import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'
const STUDIO_NAME = 'Strive Studio'
const STUDIO_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * API centralizada para enviar notificaciones por email a coaches
 * Tipos de notificación:
 * - 'aprobacion': Coach aprobado - email de bienvenida
 * - 'rechazo': Coach rechazado - email con motivo
 * - 'correcciones': Solicitar correcciones - email con lista de cambios
 * 
 * @route POST /api/coaches/notify
 * @access Admin, Staff
 */
export const POST = withAuth(
  async (request, { user, profile, supabase }) => {
    try {
      console.log(`📧 [NOTIFY API] ${profile.rol} ${profile.nombre} ${profile.apellidos} enviando notificación...`)

      // Obtener datos del body
      const { tipo, coachId, motivo, correcciones } = await request.json()

      console.log('📧 [NOTIFY API] Tipo de notificación:', tipo)
      console.log('📧 [NOTIFY API] Coach ID:', coachId)

      // Validaciones básicas
      if (!tipo || !coachId) {
        console.error('❌ [NOTIFY API] Faltan campos requeridos')
        return NextResponse.json(
          { error: 'tipo y coachId son requeridos' },
          { status: 400 }
        )
      }

      // Validar tipo de notificación
      const tiposValidos = ['aprobacion', 'rechazo', 'correcciones']
      if (!tiposValidos.includes(tipo)) {
        console.error('❌ [NOTIFY API] Tipo de notificación inválido:', tipo)
        return NextResponse.json(
          { error: 'Tipo de notificación inválido. Debe ser: aprobacion, rechazo o correcciones' },
          { status: 400 }
        )
      }

      // Validaciones específicas por tipo
      if (tipo === 'rechazo' && !motivo) {
        console.error('❌ [NOTIFY API] Motivo requerido para rechazo')
        return NextResponse.json(
          { error: 'motivo es requerido para notificaciones de rechazo' },
          { status: 400 }
        )
      }

      if (tipo === 'correcciones' && (!correcciones || correcciones.length === 0)) {
        console.error('❌ [NOTIFY API] Correcciones requeridas')
        return NextResponse.json(
          { error: 'correcciones son requeridas para este tipo de notificación' },
          { status: 400 }
        )
      }

      // Obtener datos del coach
      const { data: coachData, error: coachError } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', coachId)
        .single()

      if (coachError || !coachData) {
        console.error('❌ [NOTIFY API] Coach no encontrado:', coachError)
        return NextResponse.json(
          { error: 'Coach no encontrado' },
          { status: 404 }
        )
      }

      console.log('📧 [NOTIFY API] Coach encontrado:', coachData.nombre, coachData.apellidos)
      console.log('📧 [NOTIFY API] Email:', coachData.email)

      // Verificar que RESEND_API_KEY esté configurado
      if (!RESEND_API_KEY) {
        console.error('❌ [NOTIFY API] RESEND_API_KEY no configurado')
        return NextResponse.json(
          { error: 'Configuración de email incompleta. Contacta al administrador.' },
          { status: 500 }
        )
      }

      // Construir el email según el tipo
      let subject = ''
      let htmlContent = ''
      let textContent = ''

      switch (tipo) {
        case 'aprobacion':
          subject = `¡Bienvenido a ${STUDIO_NAME}!`
          htmlContent = `
            <h1>¡Felicidades ${coachData.nombre}!</h1>
            <p>Tu solicitud para ser coach en ${STUDIO_NAME} ha sido <strong>aprobada</strong>.</p>
            <p>Ya puedes acceder a tu panel de coach e impartir clases.</p>
            <p><a href="${STUDIO_URL}/login">Iniciar sesión</a></p>
            <br>
            <p>Saludos,<br>Equipo de ${STUDIO_NAME}</p>
          `
          textContent = `¡Felicidades ${coachData.nombre}! Tu solicitud ha sido aprobada. Accede en: ${STUDIO_URL}/login`
          break

        case 'rechazo':
          subject = `Actualización de tu solicitud en ${STUDIO_NAME}`
          htmlContent = `
            <h1>Hola ${coachData.nombre},</h1>
            <p>Lamentamos informarte que tu solicitud para ser coach en ${STUDIO_NAME} no ha sido aprobada.</p>
            <p><strong>Motivo:</strong> ${motivo}</p>
            <p>Si tienes preguntas, no dudes en contactarnos.</p>
            <br>
            <p>Saludos,<br>Equipo de ${STUDIO_NAME}</p>
          `
          textContent = `Hola ${coachData.nombre}, tu solicitud no ha sido aprobada. Motivo: ${motivo}`
          break

        case 'correcciones':
          const listaCorrecciones = correcciones.map(c => `<li>${c}</li>`).join('')
          const listaCorreccionesTexto = correcciones.map(c => `- ${c}`).join('\n')
          
          subject = `Correcciones necesarias en tu solicitud - ${STUDIO_NAME}`
          htmlContent = `
            <h1>Hola ${coachData.nombre},</h1>
            <p>Hemos revisado tu solicitud y necesitamos que realices las siguientes correcciones:</p>
            <ul>${listaCorrecciones}</ul>
            <p>Por favor, actualiza tu información y envía nuevamente tu solicitud.</p>
            <p><a href="${STUDIO_URL}/login">Acceder a mi perfil</a></p>
            <br>
            <p>Saludos,<br>Equipo de ${STUDIO_NAME}</p>
          `
          textContent = `Hola ${coachData.nombre}, correcciones necesarias:\n${listaCorreccionesTexto}\n\nAccede en: ${STUDIO_URL}/login`
          break
      }

      // Enviar email usando Resend
      console.log('📧 [NOTIFY API] Enviando email...')

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: coachData.email,
            subject: subject,
            html: htmlContent,
            text: textContent
          })
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('❌ [NOTIFY API] Error de Resend API:', data)
          return NextResponse.json(
            { error: 'Error al enviar el email: ' + (data.message || 'Error desconocido') },
            { status: response.status }
          )
        }

        console.log('✅ [NOTIFY API] Email enviado exitosamente')
        console.log('📧 [NOTIFY API] Email ID:', data.id)

        return NextResponse.json({
          success: true,
          message: 'Notificación enviada exitosamente',
          emailId: data.id,
          coach: {
            nombre: coachData.nombre,
            apellidos: coachData.apellidos,
            email: coachData.email
          }
        })

      } catch (emailError) {
        console.error('❌ [NOTIFY API] Error al llamar API de Resend:', emailError)
        return NextResponse.json(
          { error: 'Error al enviar el email: ' + emailError.message },
          { status: 500 }
        )
      }

    } catch (error) {
      console.error('❌ [NOTIFY API] Error general:', error)
      console.error('❌ [NOTIFY API] Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error interno del servidor: ' + error.message },
        { status: 500 }
      )
    }
  },
  { allowedRoles: ['admin', 'staff'] }
)