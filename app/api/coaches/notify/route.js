import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
 */
export async function POST(request) {
  try {
    console.log('📧 [NOTIFY API] Iniciando envío de notificación...')

    // Autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que es admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, nombre, apellidos')
      .eq('id', user.id)
      .single()

    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado - Solo admins pueden enviar notificaciones' },
        { status: 403 }
      )
    }

    // Obtener datos del body
    const { tipo, coachId, motivo, correcciones } = await request.json()

    console.log('📧 [NOTIFY API] Tipo de notificación:', tipo)
    console.log('📧 [NOTIFY API] Coach ID:', coachId)

    // Validaciones
    if (!tipo || !coachId) {
      return NextResponse.json(
        { error: 'tipo y coachId son requeridos' },
        { status: 400 }
      )
    }

    if (!['aprobacion', 'rechazo', 'correcciones'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de notificación inválido' },
        { status: 400 }
      )
    }

    // Obtener datos del coach
    const { data: coach, error: coachError } = await supabase
      .from('coaches_complete')
      .select('*')
      .eq('id', coachId)
      .single()

    if (coachError || !coach) {
      return NextResponse.json(
        { error: 'Coach no encontrado' },
        { status: 404 }
      )
    }

    console.log('📧 [NOTIFY API] Coach encontrado:', coach.email)

    // Generar contenido del email según el tipo
    let emailContent

    switch (tipo) {
      case 'aprobacion':
        emailContent = generarEmailAprobacion(coach, profile)
        break
      case 'rechazo':
        if (!motivo) {
          return NextResponse.json(
            { error: 'Motivo es requerido para rechazo' },
            { status: 400 }
          )
        }
        emailContent = generarEmailRechazo(coach, motivo, profile)
        break
      case 'correcciones':
        if (!correcciones || correcciones.length === 0) {
          return NextResponse.json(
            { error: 'Correcciones son requeridas' },
            { status: 400 }
          )
        }
        emailContent = generarEmailCorrecciones(coach, correcciones, profile)
        break
    }

    // Enviar email
    console.log('📧 [NOTIFY API] Enviando email a:', coach.email)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
        to: [coach.email],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ [NOTIFY API] Error de Resend:', errorData)
      return NextResponse.json(
        { error: 'Error al enviar email: ' + errorData },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('✅ [NOTIFY API] Email enviado exitosamente:', data.id)

    return NextResponse.json({
      success: true,
      emailId: data.id,
      message: 'Email enviado exitosamente'
    })

  } catch (error) {
    console.error('❌ [NOTIFY API] Error:', error)
    return NextResponse.json(
      { error: 'Error al enviar notificación: ' + error.message },
      { status: 500 }
    )
  }
}

// ===== FUNCIONES GENERADORAS DE EMAILS =====

function generarEmailAprobacion(coach, admin) {
  // ✅ RUTA CORREGIDA: /coaches/dashboard (no /coach/dashboard)
  const loginUrl = `${STUDIO_URL}/coaches/dashboard`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #0A0A0A; color: #FFFCF3; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0A0A0A; }
    .header { background: linear-gradient(135deg, #9C7A5E 0%, #AE3F21 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #FFFCF3; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; background-color: #0A0A0A; }
    .button { display: inline-block; background: linear-gradient(135deg, #9C7A5E 0%, #AE3F21 100%); color: #FFFCF3; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .info-box { background-color: rgba(156, 122, 94, 0.1); padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { text-align: center; padding: 30px; color: #B39A72; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Bienvenido al Equipo!</h1>
    </div>
    
    <div class="content">
      <h2 style="color: #FFFCF3;">¡Felicidades ${coach.nombre} ${coach.apellidos}!</h2>
      
      <p style="color: #B39A72; line-height: 1.6;">
        Nos complace informarte que <strong style="color: #FFFCF3;">has sido oficialmente aprobado</strong> 
        como coach de <strong style="color: #FFFCF3;">${STUDIO_NAME}</strong>. ¡Estamos emocionados de tenerte en el equipo!
      </p>

      <div class="info-box">
        <h3 style="color: #FFFCF3; margin-top: 0;">📋 Próximos Pasos:</h3>
        <ul style="color: #B39A72;">
          <li>Accede a tu cuenta usando el botón de abajo</li>
          <li>Revisa tu calendario de clases asignadas</li>
          <li>Familiarízate con el dashboard de coaches</li>
          <li>Configura tus horarios de disponibilidad</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Acceder a Mi Dashboard →</a>
      </div>

      <div class="info-box">
        <h3 style="color: #FFFCF3; margin-top: 0;">🔐 Tus Credenciales:</h3>
        <p style="color: #B39A72; margin: 0;">
          <strong>Email:</strong> ${coach.email}<br>
          <strong>Contraseña:</strong> La que configuraste durante el registro
        </p>
      </div>

      <p style="color: #B39A72;">
        ¡Estamos emocionados de tenerte en el equipo!<br>
        <strong style="color: #FFFCF3;">${admin.nombre} ${admin.apellidos}</strong><br>
        <em style="color: #9C7A5E;">Equipo de ${STUDIO_NAME}</em>
      </p>
    </div>
    
    <div class="footer">
      <p>${STUDIO_NAME} © ${new Date().getFullYear()}</p>
      <p>Este es un email automático, por favor no responder.</p>
      <p style="margin-top: 15px; font-size: 11px;">
        Si el botón no funciona, copia y pega este link en tu navegador:<br>
        <span style="color: #AE3F21;">${loginUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
¡Bienvenido al Equipo, ${coach.nombre}!

Nos complace informarte que has sido oficialmente aprobado como coach de ${STUDIO_NAME}.

Próximos Pasos:
- Accede a tu cuenta: ${loginUrl}
- Revisa tu calendario de clases
- Familiarízate con el dashboard

Credenciales:
Email: ${coach.email}
Contraseña: La que configuraste durante el registro

¡Estamos emocionados de tenerte en el equipo!

${admin.nombre} ${admin.apellidos}
Equipo de ${STUDIO_NAME}
  `

  return {
    subject: `🎉 ¡Bienvenido al equipo de ${STUDIO_NAME}!`,
    html,
    text
  }
}

function generarEmailRechazo(coach, motivo, admin) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #0A0A0A; color: #FFFCF3; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0A0A0A; }
    .header { background: linear-gradient(135deg, #9C7A5E 0%, #AE3F21 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #FFFCF3; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; background-color: #0A0A0A; }
    .alert-box { background-color: rgba(174, 63, 33, 0.2); border-left: 4px solid #AE3F21; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .info-box { background-color: rgba(156, 122, 94, 0.1); padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { text-align: center; padding: 30px; color: #B39A72; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Actualización de tu Solicitud</h1>
    </div>
    
    <div class="content">
      <h2 style="color: #FFFCF3;">Hola ${coach.nombre} ${coach.apellidos},</h2>
      
      <p style="color: #B39A72; line-height: 1.6;">
        Gracias por tu interés en formar parte del equipo de <strong style="color: #FFFCF3;">${STUDIO_NAME}</strong>. 
        Después de revisar cuidadosamente tu solicitud, lamentamos informarte que en este momento no podemos continuar con tu aplicación.
      </p>

      <div class="alert-box">
        <h3 style="color: #FFFCF3; margin-top: 0;">📋 Motivo:</h3>
        <p style="color: #FFFCF3; margin: 0;">
          ${motivo}
        </p>
      </div>

      <div class="info-box">
        <p style="color: #B39A72; margin: 0;">
          Esta decisión no refleja tu valor como profesional. Te animamos a seguir desarrollando tus habilidades 
          y considerar aplicar nuevamente en el futuro.
        </p>
      </div>

      <p style="color: #B39A72;">
        Si tienes alguna pregunta, no dudes en contactarnos.<br>
        <strong style="color: #FFFCF3;">${admin.nombre} ${admin.apellidos}</strong><br>
        <em style="color: #9C7A5E;">Equipo de ${STUDIO_NAME}</em>
      </p>
    </div>
    
    <div class="footer">
      <p>${STUDIO_NAME} © ${new Date().getFullYear()}</p>
      <p>Este es un email automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Actualización de tu Solicitud

Hola ${coach.nombre} ${coach.apellidos},

Gracias por tu interés en formar parte del equipo de ${STUDIO_NAME}. 
Después de revisar cuidadosamente tu solicitud, lamentamos informarte que en este momento no podemos continuar con tu aplicación.

Motivo:
${motivo}

Esta decisión no refleja tu valor como profesional. Te animamos a seguir desarrollando tus habilidades y considerar aplicar nuevamente en el futuro.

Si tienes alguna pregunta, no dudes en contactarnos.

${admin.nombre} ${admin.apellidos}
Equipo de ${STUDIO_NAME}
  `

  return {
    subject: `Actualización de tu Solicitud - ${STUDIO_NAME}`,
    html,
    text
  }
}

function generarEmailCorrecciones(coach, correcciones, admin) {
  // ✅ RUTA CORREGIDA: Debe ir a una página donde el coach pueda ver y corregir su info
  // Según tu estructura, debería ser el admin quien ve el perfil del coach
  // O si el coach tiene acceso a editar su perfil, sería /coaches/perfil
  const perfilUrl = `${STUDIO_URL}/coaches/perfil`

  const correccionesHtml = correcciones
    .map((c, i) => `
      <div style="margin: 10px 0;">
        <strong style="color: #FFFCF3;">${i + 1}. ${c}</strong>
      </div>
    `)
    .join('')

  const correccionesText = correcciones
    .map((c, i) => `${i + 1}. ${c}`)
    .join('\n')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #0A0A0A; color: #FFFCF3; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0A0A0A; }
    .header { background: linear-gradient(135deg, #9C7A5E 0%, #AE3F21 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #FFFCF3; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; background-color: #0A0A0A; }
    .button { display: inline-block; background: linear-gradient(135deg, #9C7A5E 0%, #AE3F21 100%); color: #FFFCF3; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .warning-box { background-color: rgba(174, 63, 33, 0.2); border-left: 4px solid #AE3F21; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .info-box { background-color: rgba(156, 122, 94, 0.1); padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { text-align: center; padding: 30px; color: #B39A72; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Correcciones Necesarias</h1>
    </div>
    
    <div class="content">
      <h2 style="color: #FFFCF3;">Hola ${coach.nombre} ${coach.apellidos},</h2>
      
      <p style="color: #B39A72; line-height: 1.6;">
        Hemos revisado tu solicitud para unirte a <strong style="color: #FFFCF3;">${STUDIO_NAME}</strong> 
        y necesitamos que realices algunas correcciones antes de poder continuar con el proceso de aprobación.
      </p>

      <div class="warning-box">
        <h3 style="color: #FFFCF3; margin-top: 0;">📋 Correcciones Requeridas:</h3>
        ${correccionesHtml}
      </div>

      <div style="text-align: center;">
        <a href="${perfilUrl}" class="button">Realizar Correcciones →</a>
      </div>

      <div class="info-box">
        <p style="color: #B39A72; margin: 0;">
          Una vez completadas las correcciones, revisaremos nuevamente tu solicitud. 
          Si tienes dudas sobre algún punto, no dudes en contactarnos.
        </p>
      </div>

      <p style="color: #B39A72;">
        Si tienes alguna pregunta, no dudes en contactarnos.<br>
        <strong style="color: #FFFCF3;">${admin.nombre} ${admin.apellidos}</strong><br>
        <em style="color: #9C7A5E;">Equipo de ${STUDIO_NAME}</em>
      </p>
    </div>
    
    <div class="footer">
      <p>${STUDIO_NAME} © ${new Date().getFullYear()}</p>
      <p>Este es un email automático, por favor no responder.</p>
      <p style="margin-top: 15px; font-size: 11px;">
        Si el botón no funciona, copia y pega este link en tu navegador:<br>
        <span style="color: #AE3F21;">${perfilUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Correcciones Necesarias en tu Solicitud

Hola ${coach.nombre} ${coach.apellidos},

Hemos revisado tu solicitud para unirte a ${STUDIO_NAME} y necesitamos que realices algunas correcciones antes de poder continuar con el proceso de aprobación.

Correcciones Requeridas:
${correccionesText}

Accede a tu perfil para hacer los cambios:
${perfilUrl}

Una vez completadas, revisaremos nuevamente tu solicitud.

Si tienes alguna pregunta, no dudes en contactarnos.

${admin.nombre} ${admin.apellidos}
Equipo de ${STUDIO_NAME}

---
${STUDIO_NAME}
© ${new Date().getFullYear()}
  `

  return {
    subject: `⚠️ Correcciones Necesarias - ${STUDIO_NAME}`,
    html,
    text
  }
}
