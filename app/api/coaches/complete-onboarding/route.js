import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('🚀 [API] Iniciando complete-onboarding...')

    const body = await request.json()
    const { token, formData, invitacionId } = body

    console.log('🔍 [API] Token:', token)
    console.log('🔍 [API] Email:', formData?.email)

    if (!formData || !formData.email) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
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

    // 3. SUBIR ARCHIVOS A LOS BUCKETS CORRECTOS
    console.log('📤 [API] Subiendo archivos...')
    const uploadedFiles = {}
    
    // Función helper para subir archivos
    const uploadFile = async (file, bucketName, folder, fileName) => {
      if (!file) return null
      
      try {
        // Convertir data URL a Blob si es necesario
        let fileToUpload = file
        if (typeof file === 'string' && file.startsWith('data:')) {
          const response = await fetch(file)
          const blob = await response.blob()
          fileToUpload = blob
        }

        const fileExt = fileName.split('.').pop()
        const filePath = `${userId}/${folder ? folder + '/' : ''}${Date.now()}.${fileExt}`

        console.log(`📤 Subiendo a bucket: ${bucketName}, ruta: ${filePath}`)

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, fileToUpload)

        if (error) {
          console.error(`❌ Error subiendo a ${bucketName}:`, error)
          throw error
        }

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        console.log(`✅ Archivo subido: ${urlData.publicUrl}`)
        return urlData.publicUrl

      } catch (error) {
        console.error('❌ Error uploading file:', error)
        return null
      }
    }

    // SUBIR FOTO DE PERFIL al bucket 'avatars'
    if (formData.foto_perfil) {
      console.log('📸 Subiendo foto de perfil a bucket avatars...')
      uploadedFiles.foto_perfil = await uploadFile(
        formData.foto_perfil,
        'avatars',
        null, // Sin subcarpeta, directo en userId/
        'profile.jpg'
      )
    }

    // SUBIR DOCUMENTOS al bucket 'documents'
    if (formData.ine_frente) {
      console.log('📄 Subiendo INE frente...')
      uploadedFiles.ine_frente = await uploadFile(
        formData.ine_frente,
        'documents',
        'coaches', // Carpeta coaches
        'ine_frente.jpg'
      )
    }

    if (formData.ine_reverso) {
      console.log('📄 Subiendo INE reverso...')
      uploadedFiles.ine_reverso = await uploadFile(
        formData.ine_reverso,
        'documents',
        'coaches',
        'ine_reverso.jpg'
      )
    }

    if (formData.comprobante_domicilio) {
      console.log('📄 Subiendo comprobante...')
      uploadedFiles.comprobante_domicilio = await uploadFile(
        formData.comprobante_domicilio,
        'documents',
        'coaches',
        'comprobante.pdf'
      )
    }

    console.log('✅ [API] Archivos subidos:', Object.keys(uploadedFiles))

    // 4. Crear perfil (CON avatar en profiles.avatar_url)
    console.log('👤 [API] Creando perfil...')
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: formData.email,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        avatar_url: uploadedFiles.foto_perfil || null,  // ✅ ÚNICA fuente de verdad
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

    console.log('✅ [API] Perfil creado')

    // 5. Crear coach (SIN foto_profesional_url, se usa avatar_url de profiles)
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
        foto_profesional_url: null, // ❌ Ya no se usa, se obtiene de profiles.avatar_url
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
            archivoUrl = await uploadFile(
              cert.archivo,
              'documents',
              'coaches',
              'cert.pdf'
            )
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

    // 7. Guardar documentos en tabla coach_documents
    console.log('📄 [API] Guardando referencias de documentos...')
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
    return NextResponse.json(
      { error: 'Error procesando solicitud: ' + error.message },
      { status: 500 }
    )
  }
}
