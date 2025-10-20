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
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.FROM_EMAIL
  const STUDIO_NAME = process.env.STUDIO_NAME

  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY no configurado')
    throw new Error('RESEND_API_KEY no configurado en variables de entorno')
  }

  if (!FROM_EMAIL) {
    console.warn('⚠️ FROM_EMAIL no configurado')
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
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .info-box {
          background: rgba(156, 122, 94, 0.1);
          border: 1px solid rgba(156, 122, 94, 0.3);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        .info-item {
          color: #B39A72;
          margin: 10px 0;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid rgba(156, 122, 94, 0.2);
        }
        .footer-text {
          color: #B39A72;
          font-size: 12px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <!-- Logo -->
          <div class="logo">
            <div class="logo-icon">💪</div>
            <h1 class="title">¡Únete a ${STUDIO_NAME}!</h1>
            <p class="subtitle">Invitación para ser Coach ${categoriaLabel}</p>
          </div>

          <!-- Contenido -->
          <div class="content">
            <p>Hola,</p>
            <p>
              Estamos emocionados de invitarte a formar parte de nuestro equipo de coaches en 
              <strong>${STUDIO_NAME}</strong>.
            </p>
            ${mensajePersonalizado ? `
              <div class="highlight">
                <strong>Mensaje del equipo:</strong><br>
                ${mensajePersonalizado}
              </div>
            ` : ''}
          </div>

          <!-- Información -->
          <div class="info-box">
            <div class="info-item">📋 <strong>Categoría:</strong> ${categoriaLabel}</div>
            <div class="info-item">⏰ <strong>Válido por:</strong> ${expiraDias} días</div>
            <div class="info-item">🔐 <strong>Link único:</strong> Solo puede usarse una vez</div>
          </div>

          <!-- Botón -->
          <div class="button-container">
            <a href="${inviteUrl}" class="button">
              🚀 Completar Registro
            </a>
          </div>

          <!-- Pasos -->
          <div class="info-box">
            <div class="content">
              <strong style="color: #AE3F21;">Pasos a seguir:</strong>
              <ol style="color: #B39A72; margin: 15px 0; padding-left: 20px;">
                <li>Crea tu cuenta con contraseña segura</li>
                <li>Completa tu perfil profesional</li>
                <li>Sube certificaciones y documentos</li>
                <li>Espera aprobación del equipo</li>
              </ol>
            </div>
          </div>

          <!-- Advertencia -->
          <div class="info-box" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3);">
            <div class="info-item" style="color: #f59e0b;">
              ⚠️ <strong>Importante:</strong> Este link es único y personal. 
              Solo puede ser usado una vez. Si tienes problemas, contáctanos directamente.
            </div>
          </div>

          <!-- Footer -->
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

        <!-- Link alternativo -->
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

Si tienes problemas, contáctanos directamente.

---
${STUDIO_NAME}
© ${new Date().getFullYear()}
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: `Invitación para unirte como Coach ${categoriaLabel} - ${STUDIO_NAME}`,
        html: htmlContent,
        text: textContent
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error Resend API:', errorText)
      throw new Error(`Error al enviar email: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Email enviado:', data.id)
    
    return { success: true, emailId: data.id }

  } catch (error) {
    console.error('❌ Error enviando email:', error)
    throw error
  }
}
