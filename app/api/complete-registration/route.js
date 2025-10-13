import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Validar Content-Type
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { userId, email, nombre, apellidos, telefono, emergenciaNombre, emergenciaTelefono, alergias, lesiones, userAgent } = body

    // Validar campos requeridos
    if (!userId || !email || !nombre || !apellidos || !telefono || !emergenciaNombre || !emergenciaTelefono) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'userId inválido' },
        { status: 400 }
      )
    }

    // Sanitizar strings (prevenir XSS)
    const sanitize = (str) => str.trim().slice(0, 255)

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

    // 1. Crear perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: sanitize(email),
        nombre: sanitize(nombre),
        apellidos: sanitize(apellidos),
        telefono: sanitize(telefono),
        rol: 'cliente',
        activo: true,
        require_email_verification: true
      })

    if (profileError) throw profileError

    // 2. Crear datos de salud
    const { error: healthError } = await supabase
      .from('client_health_data')
      .insert({
        user_id: userId,
        emergencia_nombre: sanitize(emergenciaNombre),
        emergencia_telefono: sanitize(emergenciaTelefono),
        alergias: sanitize(alergias || ''),
        lesiones: sanitize(lesiones || '')
      })

    if (healthError) throw healthError

    // 3. Crear aceptación legal
    const { error: legalError } = await supabase
      .from('user_legal_acceptances')
      .insert({
        user_id: userId,
        accepted_at: new Date().toISOString(),
        user_agent: sanitize(userAgent || '')
      })

    if (legalError) throw legalError

    return NextResponse.json({ success: true })

  } catch (error) {
    // No exponer detalles del error en producción
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      { 
        success: false, 
        error: isDev ? error.message : 'Error al procesar registro'
      },
      { status: 500 }
    )
  }
}