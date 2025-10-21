/**
 * Template de email para invitación de coaches
 * Compatible con Next.js 15 y Vercel
 */

export async function sendCoachInvitationEmail({ 
  to, 
  categoria, 
  inviteUrl, 
  expiraDias,
  mensajePersonalizado 
}) {
  console.log('📧 [EMAIL] Iniciando envío de email...')
  console.log('📧 [EMAIL] Destinatario:', to)
  console.log('📧 [EMAIL] Categoría:', categoria)
  console.log('📧 [EMAIL] URL de invitación:', inviteUrl)
  console.log('📧 [EMAIL] Días de expiración:', expiraDias)

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.FROM_EMAIL
  const STUDIO_NAME = process.env.STUDIO_NAME

  console.log('📧 [EMAIL] Variables de entorno:')
  console.log('  - RESEND_API_KEY:', RESEND_API_KEY ? `✅ Configurado (${RESEND_API_KEY.substring(0, 10)}...)` : '❌ NO CONFIGURADO')
  console.log('  - FROM_EMAIL:', FROM_EMAIL || '❌ NO CONFIGURADO')
  console.log('  - STUDIO_NAME:', STUDIO_NAME || '❌ NO CONFIGURADO')

  if (!RESEND_API_KEY) {
    console.error('❌ [EMAIL] RESEND_API_KEY no configurado')
    throw new Error('RESEND_API_KEY no configurado en variables de entorno')
  }

  if (!FROM_EMAIL) {
    console.error('❌ [EMAIL] FROM_EMAIL no configurado')
    throw new Error('FROM_EMAIL no configurado en variables de entorno')
  }

  const categoriaLabel = {
    'cycling': '🚴 Cycling',
    'funcional': '💪 Funcional',
    'ambos': '🔥 Cycling y Funcional'
  }[categoria] || categoria

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #1E1E1E;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .card {
          background: linear-gradient(135deg, #2A2A2A 0%, #1E1E1E 100%);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(156, 122, 94, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo-icon {
          width: 80px;
          height: 80px;
          background: rgba(174, 63, 33, 0.2);
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin-bottom: 15px;
        }
        .title {
          color: #FFFCF3;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          text-align: center;
        }
        .subtitle {
          color: #B39A72;
          font-size: 16px;
          text-align: center;
          margin-bottom: 30px;
        }
        .content {
          color: #FFFCF3;
          font-size: 15px;
          line-height: 1.8;
          margin-bottom: 25px;
        }
        .highlight {
          background: rgba(174, 63, 33, 0.2);
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #AE3F21;
          margin: 25px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #AE3F21 0%, #8B2F18 100%);
          color: #FFFCF3;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(174, 63, 33, 0.3);
          transition: all 0.3s;
        }
        .button:hover {
          box-shadow: 0 6px 16px rgba(174, 63, 33, 0.4);
          transform: translateY(-2px);
        }
        .steps {
          background: rgba(255, 252, 243, 0.05);
          padding: 20px;
          border-radius: 12px;
          margin: 25px 0;
        }
        .step {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          color: #FFFCF3;
        }
        .step-number {
          width: 32px;
          height: 32px;
          background: #AE3F21;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(156, 122, 94, 0.2);
        }
        .footer-text {
          color: #B39A72;
          font-size: 13px;
          margin: 10px 0;
        }
        .warning {
          background: rgba(255, 193, 7, 0.1);
          border-left: 4px solid #FFC107;
          padding: 15px;
          border-radius: 8px;
          color: #FFC107;
          font-size: 14px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">
            <div class="logo-icon">🏋️</div>
            <h2 class="title">¡Únete al equipo de ${STUDIO_NAME}!</h2>
            <p class="subtitle">Invitación para Coach ${categoriaLabel}</p>
          </div>

          <div class="content">
            <p>¡Hola!</p>
            <p>Te invitamos a formar parte de nuestro equipo de coaches en <strong>${STUDIO_NAME}</strong>.</p>
            
            ${mensajePersonalizado ? `
              <div class="highlight">
                <strong>Mensaje del equipo:</strong><br>
                ${mensajePersonalizado}
              </div>
            ` : ''}

            <p>Hemos seleccionado tu perfil para la categoría <strong>${categoriaLabel}</strong>.</p>
          </div>

          <div class="steps">
            <p style="color: #FFFCF3; font-weight: 600; margin-bottom: 20px;">Pasos para completar tu registro:</p>
            
            <div class="step">
              <div class="step-number">1</div>
              <div>Haz clic en el botón de abajo para acceder al registro</div>
            </div>
            
            <div class="step">
              <div class="step-number">2</div>
              <div>Completa tu información personal y profesional</div>
            </div>
            
            <div class="step">
              <div class="step-number">3</div>
              <div>Sube tus documentos y certificaciones</div>
            </div>
            
            <div class="step">
              <div class="step-number">4</div>
              <div>Firma el contrato digital</div>
            </div>
            
            <div class="step">
              <div class="step-number">5</div>
              <div>Espera la aprobación de nuestro equipo</div>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" class="button">
              Comenzar mi registro →
            </a>
          </div>

          <div class="warning">
            <strong>⚠️ Importante:</strong><br>
            Este link es único y expira en <strong>${expiraDias} días</strong>.<br>
            Solo puede ser usado una vez. Si tienes problemas, contáctanos directamente.
          </div>

          <div class="footer">
            <p class="footer-text">
              Si no solicitaste esta invitación, puedes ignorar este email.<br>
              Este link expirará automáticamente.
            </p>
            <p class="footer-text" style="margin-top: 20px;">
              <strong>${STUDIO_NAME}</strong><br>
              © ${new Date().getFullYear()} Todos los derechos reservados
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #B39A72; font-size: 12px; margin-bottom: 10px;">
            Si el botón no funciona, copia y pega este link en tu navegador:
          </p>
          <p style="color: #AE3F21; font-size: 12px; word-break: break-all; padding: 0 20px;">
            ${inviteUrl}
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
${STUDIO_NAME} - Invitación para ser Coach

¡Te invitamos a ser parte de nuestro equipo!

Categoría: ${categoriaLabel}
Link válido por: ${expiraDias} días

${mensajePersonalizado ? `Mensaje del equipo:\n${mensajePersonalizado}\n\n` : ''}

Para completar tu registro, visita:
${inviteUrl}

Pasos a seguir:
1. Crea tu cuenta
2. Completa tu perfil profesional
3. Espera la aprobación de nuestro equipo

Este link es único y expira en ${expiraDias} días.

---
${STUDIO_NAME}
© ${new Date().getFullYear()}
  `

  console.log('📧 [EMAIL] Preparando request a Resend API...')

  const emailPayload = {
    from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject: `Invitación para unirte como Coach ${categoriaLabel} - ${STUDIO_NAME}`,
    html: htmlContent,
    text: textContent
  }

  console.log('📧 [EMAIL] Payload:', JSON.stringify({
    ...emailPayload,
    html: '[HTML_CONTENT]',
    text: '[TEXT_CONTENT]'
  }, null, 2))

  try {
    console.log('📧 [EMAIL] Enviando request a Resend...')
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    console.log('📧 [EMAIL] Response status:', response.status)
    console.log('📧 [EMAIL] Response OK:', response.ok)

    const responseText = await response.text()
    console.log('📧 [EMAIL] Response raw:', responseText)

    if (!response.ok) {
      console.error('❌ [EMAIL] Error Resend API')
      console.error('Status:', response.status)
      console.error('Response:', responseText)
      throw new Error(`Error al enviar email: ${response.status} - ${responseText}`)
    }

    const data = JSON.parse(responseText)
    console.log('✅ [EMAIL] Email enviado exitosamente!')
    console.log('✅ [EMAIL] ID del email:', data.id)
    console.log('📧 [EMAIL] Respuesta completa:', JSON.stringify(data, null, 2))
    
    return { success: true, emailId: data.id }

  } catch (error) {
    console.error('❌ [EMAIL] Error enviando email:', error)
    console.error('❌ [EMAIL] Error stack:', error.stack)
    throw error
  }
}
