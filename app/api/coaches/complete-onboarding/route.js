import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('🚀 [API] Iniciando complete-onboarding...')

    const body = await request.json()
    console.log('📦 [API] Body recibido')
    
    const { token, formData, invitacionId } = body

    if (!formData || !formData.email) {
      return NextResponse.json(
        { error: 'FormData o email faltante' },
        { status: 400 }
      )
    }

    // Crear cliente con Service Role Key
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

    // 1. Verificar invitación
    console.log('🔍 [API] Verificando token...')
    const { data: invitation, error: invError } = await supabase
      .from('coach_invitations')
      .select('*')
      .eq('token', token)
      .eq('estado', 'pendiente')
      .single()

    if (invError || !invitation) {
      console.error('❌ [API] Token inválido:', invError)
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Token válido')

    // 2. Crear usuario en Auth
    console.log('👤 [API] Creando usuario en Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
      user_metadata: {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        rol: 'coach'
      }
    })

    if (authError || !authData.user) {
      console.error('❌ [API] Error creando usuario:', authError)
      return NextResponse.json(
        { error: 'Error al crear usuario: ' + (authError?.message || 'Desconocido') },
        { status: 500 }
      )
    }

    const userId = authData.user.id
    console.log('✅ [API] Usuario creado:', userId)

    // 3. SUBIR ARCHIVOS - SEPARADOS POR TIPO
    console.log('📤 [API] Subiendo archivos...')
    const uploadedFiles = {}
    
    // Función para subir a AVATARS (público)
    const uploadAvatar = async (file) => {
      if (!file || typeof file === 'string') return null
      
      try {
        let fileToUpload = file
        if (file.startsWith && file.startsWith('data:')) {
          const response = await fetch(file)
          const blob = await response.blob()
          fileToUpload = blob
        }

        const fileExt = 'jpg'
        const fileName = `${userId}-${Date.now()}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        console.log('📸 [API] Subiendo avatar a bucket "avatars":', filePath)

        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(filePath, fileToUpload, { upsert: true })

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        console.log('✅ [API] Avatar subido:', urlData.publicUrl)
        return urlData.publicUrl
      } catch (error) {
        console.error('❌ [API] Error subiendo avatar:', error)
        return null
      }
    }

    // Función para subir DOCUMENTOS (privado)
    const uploadDocument = async (file, folder, fileName) => {
      if (!file || typeof file === 'string') return null
      
      try {
        let fileToUpload = file
        if (file.startsWith && file.startsWith('data:')) {
          const response = await fetch(file)
          const blob = await response.blob()
          fileToUpload = blob
        }

        const fileExt = fileName.split('.').pop()
        const filePath = `${folder}/${userId}/${Date.now()}.${fileExt}`

        console.log('📄 [API] Subiendo documento a bucket "coach-documents":', filePath)

        const { data, error } = await supabase.storage
          .from('coach-documents')
          .upload(filePath, fileToUpload)

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('coach-documents')
          .getPublicUrl(filePath)

        return urlData.publicUrl
      } catch (error) {
        console.error('❌ [API] Error subiendo documento:', error)
        return null
      }
    }

    // Subir foto de perfil a AVATARS
    if (formData.foto_perfil) {
      uploadedFiles.foto_perfil = await uploadAvatar(formData.foto_perfil)
    }

    // Subir documentos a COACH-DOCUMENTS
    if (formData.ine_frente) {
      uploadedFiles.ine_frente = await uploadDocument(formData.ine_frente, 'documents', 'ine_frente.jpg')
    }
    if (formData.ine_reverso) {
      uploadedFiles.ine_reverso = await uploadDocument(formData.ine_reverso, 'documents', 'ine_reverso.jpg')
    }
    if (formData.comprobante_domicilio) {
      uploadedFiles.comprobante_domicilio = await uploadDocument(formData.comprobante_domicilio, 'documents', 'comprobante.pdf')
    }

    console.log('✅ [API] Archivos subidos:', Object.keys(uploadedFiles))

    // 4. Crear perfil (CON avatar)
    console.log('👤 [API] Creando perfil...')
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: formData.email,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        avatar_url: uploadedFiles.foto_perfil || null,
        rol: 'coach',
        activo: true
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('❌ [API] Error creando perfil:', profileError)
      return NextResponse.json(
        { error: 'Error al crear perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Perfil creado con avatar')

    // 5. Crear coach
    console.log('💪 [API] Creando coach...')
    const { error: coachError } = await supabase
      .from('coaches')
      .insert({
        id: userId,
        bio: formData.bio || null,
        años_experiencia: parseInt(formData.años_experiencia) || 0,
        especialidades: formData.especialidades || [],
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        tiktok: formData.tiktok || null,
        telefono: formData.telefono,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        direccion: formData.direccion || null,
        rfc: formData.rfc || null,
        contacto_emergencia: {
          nombre: formData.contacto_emergencia_nombre || '',
          telefono: formData.contacto_emergencia_telefono || ''
        },
        banco: formData.banco || null,
        clabe_encriptada: formData.clabe || null,
        titular_cuenta: formData.titular_cuenta || null,
        foto_profesional_url: uploadedFiles.foto_perfil || null,
        estado: 'pendiente',
        activo: false
      })

    if (coachError) {
      console.error('❌ [API] Error creando coach:', coachError)
      return NextResponse.json(
        { error: 'Error al crear coach: ' + coachError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Coach creado')

    // 6. Guardar certificaciones
    if (formData.certificaciones && formData.certificaciones.length > 0) {
      console.log('📜 [API] Guardando certificaciones...')
      
      const certificaciones = await Promise.all(
        formData.certificaciones.map(async (cert) => {
          let archivoUrl = null
          
          if (cert.archivo) {
            archivoUrl = await uploadDocument(cert.archivo, 'certifications', 'cert.pdf')
          }

          return {
            coach_id: userId,
            nombre: cert.nombre,
            institucion: cert.institucion,
            fecha_obtencion: cert.fecha_obtencion,
            fecha_vigencia: cert.fecha_vigencia || null,
            archivo_url: archivoUrl,
            verificado: false
          }
        })
      )

      const { error: certError } = await supabase
        .from('coach_certifications')
        .insert(certificaciones)

      if (certError) {
        console.error('⚠️ [API] Error guardando certificaciones:', certError)
      } else {
        console.log('✅ [API] Certificaciones guardadas')
      }
    }

    // 7. Guardar documentos
    console.log('📄 [API] Guardando documentos...')
    const documentos = []
    
    if (uploadedFiles.ine_frente) {
      documentos.push({
        coach_id: userId,
        tipo: 'ine_frente',
        nombre_archivo: 'INE Frente',
        archivo_url: uploadedFiles.ine_frente,
        verificado: false
      })
    }
    if (uploadedFiles.ine_reverso) {
      documentos.push({
        coach_id: userId,
        tipo: 'ine_reverso',
        nombre_archivo: 'INE Reverso',
        archivo_url: uploadedFiles.ine_reverso,
        verificado: false
      })
    }
    if (uploadedFiles.comprobante_domicilio) {
      documentos.push({
        coach_id: userId,
        tipo: 'comprobante_domicilio',
        nombre_archivo: 'Comprobante de Domicilio',
        archivo_url: uploadedFiles.comprobante_domicilio,
        verificado: false
      })
    }

    if (documentos.length > 0) {
      const { error: docsError } = await supabase
        .from('coach_documents')
        .insert(documentos)

      if (docsError) {
        console.error('⚠️ [API] Error guardando documentos:', docsError)
      } else {
        console.log('✅ [API] Documentos guardados')
      }
    }

    // 8. Marcar invitación como usada
    console.log('✅ [API] Marcando invitación como usada...')
    await supabase
      .from('coach_invitations')
      .update({
        estado: 'usado',
        usado_en: new Date().toISOString()
      })
      .eq('id', invitation.id)

    console.log('🎉 [API] Onboarding completado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Registro completado. Tu solicitud está pendiente de aprobación.',
      userId: userId
    })

  } catch (error) {
    console.error('❌ [API] Error general:', error)
    console.error('❌ [API] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Error procesando solicitud: ' + error.message },
      { status: 500 }
    )
  }
}