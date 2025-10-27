import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const maxDuration = 60

export async function POST(request) {
  try {
    console.log('🚀 [API] Iniciando onboarding...')

    const body = await request.json()
    const { token, formData, invitacionId } = body

    if (!token || !formData || !invitacionId) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // ✅ USAR SERVICE ROLE PARA BYPASS RLS
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Verificar invitación
    const { data: invitation, error: invError } = await supabase
      .from('coach_invitations')
      .select('*')
      .eq('id', invitacionId)
      .eq('token', token)
      .eq('estado', 'pendiente')
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invitación inválida' }, { status: 400 })
    }

    // 2. Crear usuario
    console.log('👤 [API] Creando usuario...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true, // ✅ Auto-confirmar email
      user_metadata: {
        nombre: formData.nombre,
        apellidos: formData.apellidos
      }
    })

    if (authError) {
      console.error('❌ [API] Error creando usuario:', authError)
      return NextResponse.json(
        { error: 'Error creando usuario: ' + authError.message },
        { status: 400 }
      )
    }

    const userId = authData.user.id
    console.log('✅ [API] Usuario creado:', userId)

    // 3. ✅ ESPERAR A QUE EL TRIGGER CREE EL PROFILE, LUEGO ACTUALIZAR
    console.log('⏳ [API] Esperando creación de profile por trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000)) // Esperar 2 segundos

    // ✅ ACTUALIZAR PROFILE CON ROL COACH (no insert, UPDATE)
    console.log('📝 [API] Actualizando profile a rol coach...')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        rol: 'coach', // ✅ CAMBIAR ROL A COACH
        avatar_url: formData.foto_perfil || null,
        activo: true,
        require_email_verification: false
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ [API] Error actualizando profile:', profileError)
      return NextResponse.json(
        { error: 'Error actualizando perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Profile actualizado a coach exitosamente')

    // 4. Crear coach
    console.log('🏋️ [API] Creando coach...')
    const { error: coachError } = await supabase
      .from('coaches')
      .insert({
        id: userId,
        telefono: formData.telefono,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        direccion: formData.direccion || null,
        rfc: formData.rfc || null,
        bio: formData.bio || null,
        años_experiencia: formData.años_experiencia ? parseInt(formData.años_experiencia) : null,
        especialidades: formData.especialidades || [],
        certificaciones: formData.certificaciones || [],
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        tiktok: formData.tiktok || null,
        banco: formData.banco || null,
        clabe_encriptada: formData.clabe ? Buffer.from(formData.clabe).toString('base64') : null,
        titular_cuenta: formData.titular_cuenta || null,
        contacto_emergencia: {
          nombre: formData.contacto_emergencia_nombre || '',
          telefono: formData.contacto_emergencia_telefono || ''
        },
        estado: 'pendiente',
        activo: false,
        fecha_ingreso: new Date().toISOString().split('T')[0]
      })

    if (coachError) {
      console.error('❌ [API] Error creando coach:', coachError)
      return NextResponse.json(
        { error: 'Error creando coach: ' + coachError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Coach creado')

    // 5. Subir archivos
    console.log('📤 [API] Subiendo archivos...')
    const uploadedFiles = {}
    const archivos = [
      { key: 'ine_frente', file: formData.ine_frente },
      { key: 'ine_reverso', file: formData.ine_reverso },
      { key: 'comprobante_domicilio', file: formData.comprobante_domicilio }
    ]

    for (const { key, file } of archivos) {
      if (file?.startsWith('data:')) {
        try {
          const base64Data = file.split(',')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          const ext = file.match(/data:image\/(\w+);/)?.[1] || 'jpg'
          const fileName = `${userId}/${key}-${Date.now()}.${ext}`

          const { data, error } = await supabase.storage
            .from('coach-documents')
            .upload(fileName, buffer, {
              contentType: `image/${ext}`,
              upsert: false
            })

          if (error) throw error

          const { data: publicData } = supabase.storage
            .from('coach-documents')
            .getPublicUrl(fileName)

          uploadedFiles[key] = publicData.publicUrl
        } catch (error) {
          console.error(`❌ [API] Error subiendo ${key}:`, error)
        }
      }
    }

    console.log('✅ [API] Archivos subidos')

    // 6. Guardar documentos en BD
    console.log('📄 [API] Guardando documentos...')
    for (const [tipo, url] of Object.entries(uploadedFiles)) {
      await supabase
        .from('coach_documents')
        .insert({
          coach_id: userId,
          tipo: tipo,
          archivo_url: url,
          verificado: false
        })
    }

    console.log('✅ [API] Documentos guardados')

    // 7. Subir foto de perfil a storage si existe
    if (formData.foto_perfil?.startsWith('data:')) {
      try {
        console.log('📸 [API] Subiendo foto de perfil...')
        const base64Data = formData.foto_perfil.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        const ext = formData.foto_perfil.match(/data:image\/(\w+);/)?.[1] || 'jpg'
        const fileName = `${userId}/avatar-${Date.now()}.${ext}`

        const { error: avatarError } = await supabase.storage
          .from('avatars')
          .upload(fileName, buffer, {
            contentType: `image/${ext}`,
            upsert: true
          })

        if (!avatarError) {
          const { data: publicData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

          // Actualizar avatar_url en profile
          await supabase
            .from('profiles')
            .update({ avatar_url: publicData.publicUrl })
            .eq('id', userId)

          console.log('✅ [API] Foto de perfil subida')
        }
      } catch (error) {
        console.error('⚠️ [API] Error subiendo foto perfil:', error)
      }
    }

    // 8. Generar PDF del contrato
    console.log('📄 [API] Generando contrato PDF...')
    let pdfUrl = null
    let contenidoContrato = ''

    try {
      // Obtener plantilla activa
      const { data: template } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('es_default', true)
        .eq('vigente', true)
        .single()

      if (template) {
        contenidoContrato = template.contenido
          .replace(/\{\{nombre\}\}/g, formData.nombre)
          .replace(/\{\{apellidos\}\}/g, formData.apellidos)
          .replace(/\{\{email\}\}/g, formData.email)
          .replace(/\{\{fecha\}\}/g, new Date().toLocaleDateString('es-MX'))
      }
    } catch (error) {
      console.error('⚠️ [API] Error obteniendo plantilla:', error)
    }

    // 9. Crear registro de contrato
    console.log('📄 [API] Creando contrato...')
    const hashDocumento = crypto.createHash('sha256')
      .update(contenidoContrato + formData.firma_digital)
      .digest('hex')

    await supabase
      .from('coach_contracts')
      .insert({
        coach_id: userId,
        template_id: null,
        tipo_contrato: 'por_clase',
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: 'activo',
        firmado: true,
        fecha_firma: new Date().toISOString(),
        firma_digital: formData.firma_digital,
        hash_documento: hashDocumento,
        vigente: true,
        version: 1,
        documento_url: pdfUrl,
        ip_firma: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent_firma: request.headers.get('user-agent')
      })

    console.log('✅ [API] Contrato creado')

    // 10. Marcar invitación como usada
    await supabase
      .from('coach_invitations')
      .update({
        estado: 'usado',
        usado_en: new Date().toISOString()
      })
      .eq('id', invitation.id)

    console.log('🎉 [API] Onboarding completado')

    return NextResponse.json({
      success: true,
      message: 'Registro completado. Tu solicitud está pendiente de aprobación.',
      userId
    })

  } catch (error) {
    console.error('❌ [API] Error:', error)
    return NextResponse.json(
      { error: 'Error procesando solicitud: ' + error.message },
      { status: 500 }
    )
  }
}
