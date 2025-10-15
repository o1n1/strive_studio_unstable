/**
 * Template de email para invitación de coaches
 * Este archivo maneja el envío de emails a coaches invitados
 */

export async function sendCoachInvitationEmail({ 
  to, 
  categoria, 
  inviteUrl, 
  expiraDias,
  mensajePersonalizado 
}) {
  // Configurar según tu proveedor de email
  // Este es un ejemplo con Resend (puedes cambiar a SendGrid, Mailgun, etc.)
  
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tudominio.com'
  const STUDIO_NAME = process.env.STUDIO_NAME || 'Nombre del Estudio'

  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY no configurado. Email no enviado.')
    return { success: false, error: 'API key no configurada' }
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
          background: rgba(174, 63, 33, 0.15);
          border-left: 4px solid #AE3F21;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .highlight-title {
          color: #AE3F21;
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .highlight-text {
          color: #B39A72;
          font-size: 14px;
          line-height: 1.6;
        }
        .cta-button {
          display: inline-block;
          background: #AE3F21;
          color: #FFFCF3;
          text-decoration: none;
          padding: 18px 40px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          text-align: center;
          margin: 30px auto;
          display: block;
          max-width: 280px;
          transition: all 0.3s;
        }
        .cta-button:hover {
          background: #8B3219;
          transform: translateY(-2px);
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 25px 0;
        }
        .info-item {
          background: rgba(156, 122, 94, 0.1);
          padding: 15px;
          border-radius: 10px;
          border: 1px solid rgba(156, 122, 94, 0.2);
        }
        .info-label {
          color: #B39A72;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .info-value {
          color: #FFFCF3;
          font-size: 16px;
          font-weight: 700;
        }
        .steps {
          background: rgba(156, 122, 94, 0.05);
          padding: 25px;
          border-radius: 12px;
          margin: 25px 0;
        }
        .step {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        .step:last-child {
          margin-bottom: 0;
        }
        .step-number {
          width: 32px;
          height: 32px;
          background: #AE3F21;
          color: #FFFCF3;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }
        .step-content {
          flex: 1;
        }
        .step-title {
          color: #FFFCF3;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .step-text {
          color: #B39A72;
          font-size: 13px;
          line-height: 1.5;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid rgba(156, 122, 94, 0.2);
        }
        .footer-text {
          color: #B39A72;
          font-size: 13px;
          line-height: 1.6;
        }
        .link {
          color: #AE3F21;
          text-decoration: none;
          word-break: break-all;
        }
        @media (max-width: 600px) {
          .card {
            padding: 30px 20px;
          }
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <!-- Logo -->
          <div class="logo">
            <div class="logo-icon">🏋️</div>
            <div style="color: #AE3F21; font-size: 24px; font-weight: 700;">${STUDIO_NAME}</div>
          </div>

          <!-- Título -->
          <h1 class="title">¡Te invitamos a ser parte de nuestro equipo!</h1>
          <p class="subtitle">Únete como Coach ${categoriaLabel}</p>

          <!-- Contenido -->
          <div class="content">
            <p>Hola,</p>
            <p>Estamos emocionados de invitarte a unirte a nuestro equipo como coach de ${categoriaLabel}. Creemos que tu experiencia y pasión serían una excelente adición a nuestra comunidad.</p>
          </div>

          ${mensajePersonalizado ? `
            <div class="highlight">
              <div class="highlight-title">💌 Mensaje del equipo</div>
              <div class="highlight-text">${mensajePersonalizado}</div>
            </div>
          ` : ''}

          <!-- Info -->
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">📂 Categoría</div>
              <div class="info-value">${categoriaLabel}</div>
            </div>
            <div class="info-item">
              <div class="info-label">⏰ Link válido por</div>
              <div class="info-value">${expiraDias} días</div>
            </div>
          </div>

          <!-- CTA -->
          <a href="${inviteUrl}" class="cta-button">
            🚀 Completar Registro
          </a>

          <!-- Pasos -->
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <div class="step-title">Crea tu cuenta</div>
                <div class="step-text">Haz clic en el botón de arriba y crea tu cuenta de coach</div>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title">Completa tu perfil</div>
                <div class="step-text">Agrega tu información profesional, certificaciones y experiencia</div>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-title">Espera aprobación</div>
                <div class="step-text">Nuestro equipo revisará tu solicitud y te notificaremos</div>
              </div>
            </div>
          </div>

          <!-- Nota importante -->
          <div class="highlight">
            <div class="highlight-title">⚠️ Importante</div>
            <div class="highlight-text">
              Este link de invitación es único y expira en <strong>${expiraDias} días</strong>. 
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
    // Ejemplo con Resend
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
      const error = await response.json()
      console.error('Error enviando email:', error)
      throw new Error('Error al enviar email')
    }

    const data = await response.json()
    console.log('✅ Email enviado exitosamente:', data.id)
    
    return { success: true, emailId: data.id }

  } catch (error) {
    console.error('❌ Error al enviar email:', error)
    throw error
  }
}

// Función auxiliar para otros proveedores de email
export async function sendEmailWithProvider(provider, emailData) {
  // Puedes agregar soporte para otros proveedores aquí
  // Ejemplos: SendGrid, Mailgun, AWS SES, etc.
  
  switch(provider) {
    case 'sendgrid':
      // Implementar SendGrid
      break
    case 'mailgun':
      // Implementar Mailgun
      break
    default:
      throw new Error(`Proveedor ${provider} no soportado`)
  }
}
