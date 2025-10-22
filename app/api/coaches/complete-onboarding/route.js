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

    // 2. Verificar si el usuario ya existe en Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === formData.email)

    let userId

    if (existingUser) {
      console.log('⚠️ [API] Usuario ya existe en Auth, usando ID existente:', existingUser.id)
      userId = existingUser.id

      // Verificar si ya tiene perfil de coach
      const { data: existingCoach } = await supabase
        .from('coaches')
        .select('id')
        .eq('id', userId)
        .single()

      if (existingCoach) {
        return NextResponse.json(
          { error: 'Este coach ya está registrado en el sistema' },
          { status: 400 }
        )
      }
    } else {
      // 2b. Crear usuario nuevo en Supabase Auth
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

      if (authError) {
        console.error('❌ [API] Error creando usuario:', authError)
        return NextResponse.json(
          { error: 'Error al crear usuario: ' + authError.message },
          { status: 500 }
        )
      }

      userId = authData.user.id
      console.log('✅ [API] Usuario creado:', userId)
    }

    // 3. Crear o actualizar perfil en tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: formData.email,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        rol: 'coach',
        activo: true
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('❌ [API] Error creando/actualizando perfil:', profileError)
      return NextResponse.json(
        { error: 'Error al crear perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Perfil creado/actualizado')

    // 4. Subir archivos a Storage (CORREGIDO)
    const uploadedFiles = {}
    
    // Función helper mejorada para subir archivos
    const uploadFile = async (file, bucketName, folder, fileName) => {
      if (!file || typeof file === 'string') return null
      
      try {
        // Convertir base64 a blob si es necesario
        let fileToUpload = file
        let fileExt = 'jpg' // default

        if (typeof file === 'string') {
          // Si es base64
          if (file.startsWith('data:')) {
            const response = await fetch(file)
            const blob = await response.blob()
            fileToUpload = blob
            
            // Extraer extensión del tipo MIME
            const mimeType = file.split(';')[0].split(':')[1]
            fileExt = mimeType.split('/')[1]
          }
        } else if (file.name) {
          // Si es objeto File
          fileExt = file.name.split('.').pop()
        }

        const timestamp = Date.now()
        const filePath = `${userId}/${folder}/${timestamp}.${fileExt}`

        console.log(`📤 Subiendo archivo a ${bucketName}/${filePath}`)

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, fileToUpload, {
            contentType: file.type || `image/${fileExt}`,
            upsert: false
          })

        if (error) {
          console.error(`❌ Error subiendo a ${bucketName}/${filePath}:`, error)
          throw error
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        console.log(`✅ Archivo subido: ${urlData.publicUrl}`)
        return urlData.publicUrl

      } catch (error) {
        console.error(`❌ Error en uploadFile (${bucketName}/${folder}):`, error)
        return null
      }
    }

    // Subir foto de perfil (bucket PÚBLICO)
    if (formData.foto_perfil) {
      uploadedFiles.foto_perfil = await uploadFile(
        formData.foto_perfil,
        'coach-profile-photos', // BUCKET PÚBLICO
        'profile',
        'profile.jpg'
      )
    }

    // Subir documentos sensibles (bucket PRIVADO)
    if (formData.ine_frente) {
      uploadedFiles.ine_frente = await uploadFile(
        formData.ine_frente,
        'coach-documents', // BUCKET PRIVADO
        'ine',
        'ine_frente.jpg'
      )
    }

    if (formData.ine_reverso) {
      uploadedFiles.ine_reverso = await uploadFile(
        formData.ine_reverso,
        'coach-documents',
        'ine',
        'ine_reverso.jpg'
      )
    }

    if (formData.comprobante_domicilio) {
      uploadedFiles.comprobante_domicilio = await uploadFile(
        formData.comprobante_domicilio,
        'coach-documents',
        'documentos',
        'comprobante.pdf'
      )
    }

    if (formData.titulo_cedula) {
      uploadedFiles.titulo_cedula = await uploadFile(
        formData.titulo_cedula,
        'coach-documents',
        'certificaciones',
        'titulo.pdf'
      )
    }

    if (formData.antecedentes_penales) {
      uploadedFiles.antecedentes_penales = await uploadFile(
        formData.antecedentes_penales,
        'coach-documents',
        'documentos',
        'antecedentes.pdf'
      )
    }

    if (formData.estado_cuenta) {
      uploadedFiles.estado_cuenta = await uploadFile(
        formData.estado_cuenta,
        'coach-documents',
        'bancarios',
        'estado_cuenta.pdf'
      )
    }

    console.log('✅ [API] Archivos subidos:', Object.keys(uploadedFiles))

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
          telefono: formData.contacto_emergencia_telefono || '',
          relacion: formData.contacto_emergencia_relacion || ''
        },
        banco: formData.banco || null,
        clabe_encriptada: formData.clabe || null, // TODO: Encriptar en producción
        titular_cuenta: formData.titular_cuenta || null,
        foto_profesional_url: uploadedFiles.foto_perfil || null,
        estado: 'pendiente',
        activo: false,
        fecha_ingreso: new Date().toISOString().split('T')[0]
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
    
    const documentosMap = [
      { key: 'ine_frente', tipo: 'ine_frente', nombre: 'INE Frente' },
      { key: 'ine_reverso', tipo: 'ine_reverso', nombre: 'INE Reverso' },
      { key: 'comprobante_domicilio', tipo: 'comprobante_domicilio', nombre: 'Comprobante de Domicilio' },
      { key: 'titulo_cedula', tipo: 'titulo_cedula', nombre: 'Título/Cédula' },
      { key: 'antecedentes_penales', tipo: 'antecedentes_penales', nombre: 'Antecedentes No Penales' },
      { key: 'estado_cuenta', tipo: 'estado_cuenta', nombre: 'Estado de Cuenta' }
    ]

    documentosMap.forEach(({ key, tipo, nombre }) => {
      if (uploadedFiles[key]) {
        documentos.push({
          coach_id: userId,
          tipo,
          nombre_archivo: nombre,
          archivo_url: uploadedFiles[key],
          verificado: false
        })
      }
    })

    if (documentos.length > 0) {
      const { error: docsError } = await supabase
        .from('coach_documents')
        .insert(documentos)

      if (docsError) {
        console.error('⚠️ [API] Error guardando documentos:', docsError)
      } else {
        console.log(`✅ [API] ${documentos.length} documentos guardados`)
      }
    }

    // 7. Guardar certificaciones si existen
    if (formData.certificaciones && formData.certificaciones.length > 0) {
      const certificaciones = formData.certificaciones.map(cert => ({
        coach_id: userId,
        nombre: cert.nombre,
        institucion: cert.institucion,
        fecha_obtencion: cert.fecha_obtencion,
        fecha_vigencia: cert.fecha_vigencia || null,
        archivo_url: cert.archivo_url || null,
        verificado: false
      }))

      const { error: certError } = await supabase
        .from('coach_certifications')
        .insert(certificaciones)

      if (certError) {
        console.error('⚠️ [API] Error guardando certificaciones:', certError)
      } else {
        console.log(`✅ [API] ${certificaciones.length} certificaciones guardadas`)
      }
    }

    // 8. Marcar invitación como usada
    const { error: updateInvError } = await supabase
      .from('coach_invitations')
      .update({
        estado: 'usado',
        usado_en: new Date().toISOString()
      })
      .eq('id', invitacion.id)

    if (updateInvError) {
      console.error('⚠️ [API] Error actualizando invitación:', updateInvError)
    } else {
      console.log('✅ [API] Invitación marcada como usada')
    }

    // 9. TODO: Enviar email de confirmación al coach
    // 10. TODO: Enviar notificación a admins de nueva solicitud pendiente

    console.log('✅ [API] Onboarding completado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Registro completado. Tu solicitud está en revisión.',
      userId,
      coachId: userId
    })

  } catch (error) {
    console.error('❌ [API] Error general en complete-onboarding:', error)
    return NextResponse.json(
      { error: 'Error procesando solicitud: ' + error.message },
      { status: 500 }
    )
  }
}