/**
 * Template MEJORADO de email para invitación de coaches
 * Mismo formato profesional que el email de correcciones
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #0A0A0A;
      color: #FFFCF3;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0A0A0A;
    }
    .header {
      background: linear-gradient(135deg, #AE3F21 0%, #9C7A5E 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #FFFCF3;
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 40px 30px;
      background-color: #0A0A0A;
    }
    .content h2 {
      color: #FFFCF3;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .content p {
      color: #B39A72;
      line-height: 1.6;
      margin: 15px 0;
    }
    .welcome-box {
      background-color: rgba(174, 63, 33, 0.1);
      border-left: 4px solid #AE3F21;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .welcome-box p {
      color: #FFFCF3;
      font-size: 18px;
      margin: 0;
    }
    .steps-box {
      background-color: rgba(156, 122, 94, 0.1);
      border: 1px solid rgba(156, 122, 94, 0.3);
      padding: 25px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .steps-box h3 {
      color: #FFFCF3;
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 18px;
    }
    .step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 15px;
      gap: 15px;
    }
    .step-number {
      background-color: rgba(174, 63, 33, 0.2);
      color: #AE3F21;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
    }
    .step-text {
      color: #B39A72;
      line-height: 1.6;
      padding-top: 4px;
    }
    .button {
      display: inline-block;
      background-color: #AE3F21;
      color: #FFFCF3;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 25px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #8c3219;
    }
    .warning-box {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .warning-box p {
      color: #FFFCF3;
      margin: 0;
      font-size: 14px;
    }
    .info-box {
      background-color: rgba(156, 122, 94, 0.1);
      border: 1px solid rgba(156, 122, 94, 0.3);
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #B39A72;
      font-size: 12px;
      border-top: 1px solid rgba(156, 122, 94, 0.2);
    }
    .footer p {
      margin: 5px 0;
      color: #B39A72;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Invitación Especial!</h1>
    </div>
    
    <div class="content">
      <h2>Te invitamos a ser parte de nuestro equipo</h2>
      
      <div class="welcome-box">
        <p><strong>¡Felicidades! Has sido seleccionado para unirte a ${STUDIO_NAME}</strong></p>
      </div>
      
      <p>
        Nos complace invitarte a formar parte de nuestro equipo como coach de <strong>${categoriaLabel}</strong>. 
        Hemos revisado tu perfil y creemos que serías una excelente adición a nuestro estudio.
      </p>

      ${mensajePersonalizado ? `
      <div class="info-box">
        <p style="color: #FFFCF3; margin: 0;"><strong>Mensaje del equipo:</strong></p>
        <p style="color: #B39A72; margin-top: 10px; font-style: italic;">"${mensajePersonalizado}"</p>
      </div>
      ` : ''}

      <div class="steps-box">
        <h3>📋 Pasos para Completar tu Registro:</h3>
        
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-text">Haz clic en el botón de abajo para acceder a tu invitación</div>
        </div>
        
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-text">Crea tu cuenta con tus credenciales</div>
        </div>
        
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-text">Completa tu información personal y profesional</div>
        </div>
        
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-text">Sube tus documentos y certificaciones</div>
        </div>
        
        <div class="step">
          <div class="step-number">5</div>
          <div class="step-text">Firma el contrato digital</div>
        </div>
        
        <div class="step">
          <div class="step-number">6</div>
          <div class="step-text">Espera la aprobación de nuestro equipo</div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${inviteUrl}" class="button">Comenzar mi Registro →</a>
      </div>

      <div class="warning-box">
        <p>
          <strong>⚠️ Importante:</strong><br>
          Este link es único y personal. Expira en <strong>${expiraDias} días</strong> y solo puede ser usado una vez.
          Si tienes problemas para acceder, contáctanos directamente.
        </p>
      </div>

      <p style="margin-top: 30px;">
        Estamos emocionados de que consideres unirte a nuestro equipo. Si tienes alguna pregunta sobre el proceso, 
        no dudes en contactarnos.
      </p>

      <p>
        <strong style="color: #FFFCF3;">Equipo de ${STUDIO_NAME}</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>${STUDIO_NAME} © ${new Date().getFullYear()}</p>
      <p>Este es un email automático, por favor no responder directamente.</p>
      <p style="margin-top: 15px; font-size: 11px;">
        Si el botón no funciona, copia y pega este link en tu navegador:<br>
        <span style="color: #AE3F21;">${inviteUrl}</span>
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

${mensajePersonalizado ? `Mensaje del equipo:\n"${mensajePersonalizado}"\n\n` : ''}

Pasos para completar tu registro:

1. Haz clic en el link para acceder a tu invitación
2. Crea tu cuenta con tus credenciales
3. Completa tu información personal y profesional
4. Sube tus documentos y certificaciones
5. Firma el contrato digital
6. Espera la aprobación de nuestro equipo

Para comenzar tu registro, visita:
${inviteUrl}

⚠️ IMPORTANTE:
Este link es único y expira en ${expiraDias} días.
Solo puede ser usado una vez.

---
${STUDIO_NAME}
© ${new Date().getFullYear()}

Si el link no funciona, copia y pega la URL completa en tu navegador.
  `

  console.log('📧 [EMAIL] Preparando request a Resend API...')

  const emailPayload = {
    from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject: `🎉 Invitación para unirte como Coach ${categoriaLabel} - ${STUDIO_NAME}`,
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
