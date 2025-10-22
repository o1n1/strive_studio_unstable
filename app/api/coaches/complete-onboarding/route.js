import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { token, formData, invitacionId } = await request.json()

    console.log('🔵 [API] Iniciando complete-onboarding...')

    // Crear cliente Supabase con Service Role Key
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

    // 1. Verificar que el token sea válido
    const { data: invitacion, error: invError } = await supabase
      .from('coach_invitations')
      .select('*')
      .eq('token', token)
      .eq('estado', 'pendiente')
      .single()

    if (invError || !invitacion) {
      return NextResponse.json(
        { error: 'Invitación inválida o ya usada' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Invitación válida:', invitacion.id)

    // 2. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        rol: 'coach'
      }
    })

    if (authError) {
      console.error('❌ [API] Error creando usuario:', authError)
      return NextResponse.json(
        { error: 'Error al crear usuario: ' + authError.message },
        { status: 500 }
      )
    }

    const userId = authData.user.id
    console.log('✅ [API] Usuario creado:', userId)

    // 3. Crear perfil en tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: formData.email,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        rol: 'coach',
        activo: true
      })

    if (profileError) {
      console.error('❌ [API] Error creando perfil:', profileError)
      // Eliminar usuario de auth si falla
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Error al crear perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Perfil creado')

    // 4. Subir archivos a Storage
    const uploadedFiles = {}
    
    // Función helper para subir archivos
    const uploadFile = async (file, folder, fileName) => {
      if (!file || typeof file === 'string') return null
      
      try {
        // Convertir base64 a File si es necesario
        let fileToUpload = file
        if (file.startsWith && file.startsWith('data:')) {
          const response = await fetch(file)
          const blob = await response.blob()
          fileToUpload = blob
        }

        const fileExt = fileName.split('.').pop()
        const filePath = `${folder}/${userId}/${Date.now()}.${fileExt}`

        const { data, error } = await supabase.storage
          .from('coach-documents')
          .upload(filePath, fileToUpload)

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('coach-documents')
          .getPublicUrl(filePath)

        return urlData.publicUrl
      } catch (error) {
        console.error('Error uploading file:', error)
        return null
      }
    }

    // Subir foto de perfil
    if (formData.foto_perfil) {
      uploadedFiles.foto_perfil = await uploadFile(
        formData.foto_perfil,
        'profile',
        formData.foto_perfil.name || 'profile.jpg'
      )
    }

    // Subir documentos
    if (formData.ine_frente) {
      uploadedFiles.ine_frente = await uploadFile(
        formData.ine_frente,
        'documents',
        formData.ine_frente.name || 'ine_frente.jpg'
      )
    }
    if (formData.ine_reverso) {
      uploadedFiles.ine_reverso = await uploadFile(
        formData.ine_reverso,
        'documents',
        formData.ine_reverso.name || 'ine_reverso.jpg'
      )
    }
    if (formData.comprobante_domicilio) {
      uploadedFiles.comprobante_domicilio = await uploadFile(
        formData.comprobante_domicilio,
        'documents',
        formData.comprobante_domicilio.name || 'comprobante.pdf'
      )
    }
    if (formData.titulo_cedula) {
      uploadedFiles.titulo_cedula = await uploadFile(
        formData.titulo_cedula,
        'documents',
        formData.titulo_cedula.name || 'titulo.pdf'
      )
    }
    if (formData.antecedentes_penales) {
      uploadedFiles.antecedentes_penales = await uploadFile(
        formData.antecedentes_penales,
        'documents',
        formData.antecedentes_penales.name || 'antecedentes.pdf'
      )
    }
    if (formData.estado_cuenta) {
      uploadedFiles.estado_cuenta = await uploadFile(
        formData.estado_cuenta,
        'documents',
        formData.estado_cuenta.name || 'estado_cuenta.pdf'
      )
    }

    console.log('✅ [API] Archivos subidos')

    // 5. Crear registro en tabla coaches
    const { error: coachError } = await supabase
      .from('coaches')
      .insert({
        id: userId,
        bio: formData.bio || null,
        años_experiencia: formData.años_experiencia || 0,
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
        clabe_encriptada: formData.clabe || null, // TODO: Encriptar en producción
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

    // 6. Guardar documentos en tabla coach_documents
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
    if (uploadedFiles.titulo_cedula) {
      documentos.push({
        coach_id: userId,
        tipo: 'titulo_cedula',
        nombre_archivo: 'Título/Cédula',
        archivo_url: uploadedFiles.titulo_cedula,
        verificado: false
      })
    }
    if (uploadedFiles.antecedentes_penales) {
      documentos.push({
        coach_id: userId,
        tipo: 'antecedentes_penales',
        nombre_archivo: 'Antecedentes No Penales',
        archivo_url: uploadedFiles.antecedentes_penales,
        verificado: false
      })
    }
    if (uploadedFiles.estado_cuenta) {
      documentos.push({
        coach_id: userId,
        tipo: 'estado_cuenta',
        nombre_archivo: 'Estado de Cuenta',
        archivo_url: uploadedFiles.estado_cuenta,
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

    // 7. Guardar certificaciones en tabla coach_certifications
    if (formData.certificaciones && formData.certificaciones.length > 0) {
      const certificaciones = []

      for (const cert of formData.certificaciones) {
        let archivoUrl = null
        
        if (cert.archivo) {
          archivoUrl = await uploadFile(
            cert.archivo,
            'certifications',
            cert.archivo.name || 'certificacion.pdf'
          )
        }

        certificaciones.push({
          coach_id: userId,
          nombre: cert.nombre,
          institucion: cert.institucion,
          fecha_obtencion: cert.fecha_obtencion,
          fecha_vigencia: cert.fecha_vigencia || null,
          archivo_url: archivoUrl,
          verificado: false
        })
      }

      const { error: certsError } = await supabase
        .from('coach_certifications')
        .insert(certificaciones)

      if (certsError) {
        console.error('⚠️ [API] Error guardando certificaciones:', certsError)
      } else {
        console.log('✅ [API] Certificaciones guardadas')
      }
    }

    // 8. Guardar contrato en tabla coach_contracts
    const { error: contractError } = await supabase
      .from('coach_contracts')
      .insert({
        coach_id: userId,
        tipo_contrato: 'por_clase', // Default
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: 'activo',
        firma_digital: formData.firma_digital,
        firmado: true,
        fecha_firma: new Date().toISOString(),
        vigente: true
      })

    if (contractError) {
      console.error('⚠️ [API] Error guardando contrato:', contractError)
    } else {
      console.log('✅ [API] Contrato guardado')
    }

    // 9. Marcar invitación como usada
    await supabase
      .from('coach_invitations')
      .update({
        estado: 'usado',
        usado_en: new Date().toISOString()
      })
      .eq('id', invitacionId)

    console.log('✅ [API] Invitación marcada como usada')

    // 10. TODO: Enviar email de notificación al admin
    // await sendAdminNotificationEmail(...)

    console.log('✅ [API] Onboarding completado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Registro completado. Tu solicitud será revisada por el equipo.',
      userId
    })

  } catch (error) {
    console.error('❌ [API] Error en complete-onboarding:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    )
  }
}