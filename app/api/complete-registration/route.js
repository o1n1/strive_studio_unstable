import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  console.log('🔵 Endpoint /api/complete-registration llamado')

  try {
    // Validar Content-Type
    if (!request.headers.get('content-type')?.includes('application/json')) {
      console.error('❌ Content-Type inválido')
      return NextResponse.json(
        { success: false, error: 'Content-Type inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('📦 Body recibido:', { ...body, password: '***' })

    const { userId, email, nombre, apellidos, telefono, emergenciaNombre, emergenciaTelefono, alergias, lesiones, userAgent } = body

    // Validar campos requeridos
    if (!userId || !email || !nombre || !apellidos || !telefono || !emergenciaNombre || !emergenciaTelefono) {
      console.error('❌ Faltan campos requeridos')
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      console.error('❌ userId inválido:', userId)
      return NextResponse.json(
        { success: false, error: 'userId inválido' },
        { status: 400 }
      )
    }

    // Sanitizar strings
    const sanitize = (str) => str.trim().slice(0, 255)

    console.log('🔑 Verificando credenciales...')
    console.log('URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

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

    console.log('✅ Cliente Supabase creado')

    // 1. Crear perfil
    console.log('📝 Insertando perfil...')
    const { data: profileData, error: profileError } = await supabase
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

    if (profileError) {
      console.error('❌ Error insertando perfil:', profileError)
      throw profileError
    }
    console.log('✅ Perfil insertado')

    // 2. Crear datos de salud
    console.log('📝 Insertando datos de salud...')
    const { data: healthData, error: healthError } = await supabase
      .from('client_health_data')
      .insert({
        user_id: userId,
        emergencia_nombre: sanitize(emergenciaNombre),
        emergencia_telefono: sanitize(emergenciaTelefono),
        alergias: sanitize(alergias || ''),
        lesiones: sanitize(lesiones || '')
      })

    if (healthError) {
      console.error('❌ Error insertando datos de salud:', healthError)
      throw healthError
    }
    console.log('✅ Datos de salud insertados')

    // 3. Crear aceptación legal
    console.log('📝 Insertando aceptación legal...')
    const { data: legalData, error: legalError } = await supabase
      .from('user_legal_acceptances')
      .insert({
        user_id: userId,
        accepted_at: new Date().toISOString(),
        user_agent: sanitize(userAgent || '')
      })

    if (legalError) {
      console.error('❌ Error insertando aceptación legal:', legalError)
      throw legalError
    }
    console.log('✅ Aceptación legal insertada')

    console.log('🎉 Registro completado exitosamente')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('💥 Error completo:', error)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)

    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.details,
        hint: error.hint
      },
      { status: 500 }
    )
  }
}
