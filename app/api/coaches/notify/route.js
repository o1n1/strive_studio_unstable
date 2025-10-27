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
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0A0A0A; color: #FFFCF3; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #0A0A0A; }
    .header { background: linear-gradient(135deg, #AE3F21 0%, #9C7A5E 100%); padding: 40px 20px; text-align: center; }
    .content { padding: 40px 20px; }
    .button { display: inline-block; background: #AE3F21; color: #FFFCF3; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #FFFCF3; margin: 0;">¡Felicidades!</h1>
    </div>
    <div class="content">
      <h2>Hola ${coachData.nombre},</h2>
      <p>Tu solicitud para ser coach en <strong>${STUDIO_NAME}</strong> ha sido <strong style="color: #10b981;">APROBADA</strong>.</p>
      <p>Ya puedes acceder a tu panel de coach e impartir clases.</p>
      <p style="text-align: center;">
        <a href="${STUDIO_URL}/coach/dashboard" class="button">Acceder a mi Panel</a>
      </p>
      <p>Saludos,<br><strong>Equipo de ${STUDIO_NAME}</strong></p>
    </div>
  </div>
</body>
</html>
          `
          textContent = `¡Felicidades ${coachData.nombre}! Tu solicitud ha sido aprobada. Accede en: ${STUDIO_URL}/coach/dashboard`
          break

        case 'rechazo':
          subject = `Actualización de tu solicitud en ${STUDIO_NAME}`
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0A0A0A; color: #FFFCF3; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #0A0A0A; }
    .header { background: linear-gradient(135deg, #353535 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; }
    .content { padding: 40px 20px; }
    .alert-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #FFFCF3; margin: 0;">Actualización de Solicitud</h1>
    </div>
    <div class="content">
      <h2>Hola ${coachData.nombre},</h2>
      <p>Lamentamos informarte que tu solicitud para ser coach en ${STUDIO_NAME} no ha sido aprobada en este momento.</p>
      <div class="alert-box">
        <p style="margin: 0;"><strong>Motivo:</strong> ${motivo}</p>
      </div>
      <p>Si tienes preguntas, no dudes en contactarnos a <strong>strive.studio99@gmail.com</strong></p>
      <p>Saludos,<br><strong>Equipo de ${STUDIO_NAME}</strong></p>
    </div>
  </div>
</body>
</html>
          `
          textContent = `Hola ${coachData.nombre}, tu solicitud no ha sido aprobada.\n\nMotivo: ${motivo}\n\nContacto: strive.studio99@gmail.com`
          break

        case 'correcciones':
          // ✅ CORRECCIÓN: Manejar correcciones como strings o objetos
          let listaCorrecciones = ''
          let listaCorreccionesTexto = ''
          
          if (Array.isArray(correcciones)) {
            listaCorrecciones = correcciones
              .map(c => {
                // Si es string, usar directamente
                if (typeof c === 'string') {
                  return `<li style="margin-bottom: 10px;">${c}</li>`
                }
                // Si es objeto, extraer el texto o mensaje
                if (typeof c === 'object' && c !== null) {
                  const texto = c.texto || c.mensaje || c.descripcion || c.correccion || JSON.stringify(c)
                  return `<li style="margin-bottom: 10px;">${texto}</li>`
                }
                return `<li style="margin-bottom: 10px;">${String(c)}</li>`
              })
              .join('')
            
            listaCorreccionesTexto = correcciones
              .map((c, index) => {
                if (typeof c === 'string') {
                  return `${index + 1}. ${c}`
                }
                if (typeof c === 'object' && c !== null) {
                  const texto = c.texto || c.mensaje || c.descripcion || c.correccion || JSON.stringify(c)
                  return `${index + 1}. ${texto}`
                }
                return `${index + 1}. ${String(c)}`
              })
              .join('\n')
          } else {
            // Si no es array, convertir a string
            listaCorrecciones = `<li>${String(correcciones)}</li>`
            listaCorreccionesTexto = String(correcciones)
          }
          
          subject = `Correcciones necesarias en tu solicitud - ${STUDIO_NAME}`
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0A0A0A; color: #FFFCF3; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #0A0A0A; }
    .header { background: linear-gradient(135deg, #AE3F21 0%, #9C7A5E 100%); padding: 40px 20px; text-align: center; }
    .content { padding: 40px 20px; }
    .alert-box { background: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #AE3F21; color: #FFFCF3; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    ul { margin: 15px 0; padding-left: 20px; }
    li { margin-bottom: 10px; color: #B39A72; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #FFFCF3; margin: 0;">Correcciones Necesarias</h1>
    </div>
    <div class="content">
      <h2>Hola ${coachData.nombre},</h2>
      <p>Hemos revisado tu solicitud y necesitamos que realices las siguientes correcciones:</p>
      <div class="alert-box">
        <ul>
          ${listaCorrecciones}
        </ul>
      </div>
      <p>Por favor, accede a tu perfil para revisar y actualizar la información solicitada.</p>
      <p style="text-align: center;">
        <a href="${STUDIO_URL}/coach/perfil" class="button">Revisar y Corregir →</a>
      </p>
      <p style="color: #B39A72; font-size: 14px;">⚠️ <strong>Importante:</strong> Una vez realices las correcciones, nuestro equipo las revisará nuevamente.</p>
      <p>Saludos,<br><strong>Equipo de ${STUDIO_NAME}</strong></p>
    </div>
  </div>
</body>
</html>
          `
          textContent = `Hola ${coachData.nombre},

Hemos revisado tu solicitud y necesitamos las siguientes correcciones:

${listaCorreccionesTexto}

Por favor, accede a tu perfil para revisar y actualizar la información:
${STUDIO_URL}/coach/perfil

⚠️ Importante: Una vez realices las correcciones, nuestro equipo las revisará nuevamente.

Saludos,
Equipo de ${STUDIO_NAME}`
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
            from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
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
