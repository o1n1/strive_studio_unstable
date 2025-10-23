import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('🔄 [UPDATE PROFILE API] Iniciando actualización de perfil...')

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { coachId, formData } = body

    if (!coachId || !formData) {
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

    // Verificar que el coach existe y está en estado pendiente
    const { data: coachActual, error: checkError } = await supabase
      .from('coaches')
      .select('estado')
      .eq('id', coachId)
      .single()

    if (checkError || !coachActual) {
      return NextResponse.json(
        { error: 'Coach no encontrado' },
        { status: 404 }
      )
    }

    if (coachActual.estado !== 'pendiente') {
      return NextResponse.json(
        { error: 'El perfil ya fue procesado y no puede editarse' },
        { status: 403 }
      )
    }

    console.log('✅ [UPDATE PROFILE API] Coach válido, procediendo a actualizar...')

    // ========================================
    // 1. SUBIR NUEVOS ARCHIVOS SI HAY
    // ========================================
    const uploadedFiles = {}
    
    const uploadFile = async (file, bucketName, folder, fileName) => {
      if (!file) return null
      
      // Si es una URL existente, no subir de nuevo
      if (typeof file === 'string' && (file.startsWith('http') || file.startsWith('https'))) {
        return file
      }
      
      try {
        let fileToUpload = file
        if (typeof file === 'string' && file.startsWith('data:')) {
          const response = await fetch(file)
          const blob = await response.blob()
          fileToUpload = blob
        }

        const fileExt = fileName.split('.').pop()
        const filePath = `${folder ? folder + '/' : ''}${coachId}/${Date.now()}.${fileExt}`

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

    // Subir foto de perfil si hay nueva
    if (formData.foto_perfil && !formData.foto_perfil.startsWith('http')) {
      uploadedFiles.foto_perfil = await uploadFile(
        formData.foto_perfil,
        'avatars',
        null,
        'profile.jpg'
      )
    }

    // Subir documentos si hay nuevos
    if (formData.ine_frente && !formData.ine_frente.startsWith('http')) {
      uploadedFiles.ine_frente = await uploadFile(
        formData.ine_frente,
        'documents',
        'coaches',
        'ine_frente.jpg'
      )
    }

    if (formData.ine_reverso && !formData.ine_reverso.startsWith('http')) {
      uploadedFiles.ine_reverso = await uploadFile(
        formData.ine_reverso,
        'documents',
        'coaches',
        'ine_reverso.jpg'
      )
    }

    if (formData.comprobante_domicilio && !formData.comprobante_domicilio.startsWith('http')) {
      uploadedFiles.comprobante_domicilio = await uploadFile(
        formData.comprobante_domicilio,
        'documents',
        'coaches',
        'comprobante.pdf'
      )
    }

    console.log('✅ [UPDATE PROFILE API] Archivos procesados:', Object.keys(uploadedFiles))

    // ========================================
    // 2. ACTUALIZAR PERFIL
    // ========================================
    console.log('👤 [UPDATE PROFILE API] Actualizando perfil...')
    
    const profileUpdate = {
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      telefono: formData.telefono
    }

    // Solo actualizar avatar si hay uno nuevo
    if (uploadedFiles.foto_perfil) {
      profileUpdate.avatar_url = uploadedFiles.foto_perfil
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', coachId)

    if (profileError) {
      console.error('❌ [UPDATE PROFILE API] Error actualizando perfil:', profileError)
      throw new Error('Error al actualizar perfil: ' + profileError.message)
    }

    console.log('✅ [UPDATE PROFILE API] Perfil actualizado')

    // ========================================
    // 3. ACTUALIZAR COACH
    // ========================================
    console.log('💪 [UPDATE PROFILE API] Actualizando datos de coach...')
    
    const { error: coachError } = await supabase
      .from('coaches')
      .update({
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
        updated_at: new Date().toISOString()
      })
      .eq('id', coachId)

    if (coachError) {
      console.error('❌ [UPDATE PROFILE API] Error actualizando coach:', coachError)
      throw new Error('Error al actualizar coach: ' + coachError.message)
    }

    console.log('✅ [UPDATE PROFILE API] Datos de coach actualizados')

    // ========================================
    // 4. ACTUALIZAR DOCUMENTOS SI HAY NUEVOS
    // ========================================
    if (Object.keys(uploadedFiles).length > 0) {
      console.log('📄 [UPDATE PROFILE API] Actualizando documentos...')

      // Marcar documentos como no verificados cuando se actualizan
      const docsToUpdate = []

      if (uploadedFiles.ine_frente) {
        docsToUpdate.push({
          coach_id: coachId,
          tipo: 'ine_frente',
          nombre_archivo: 'INE Frente',
          archivo_url: uploadedFiles.ine_frente,
          verificado: false,
          fecha_subida: new Date().toISOString()
        })
      }

      if (uploadedFiles.ine_reverso) {
        docsToUpdate.push({
          coach_id: coachId,
          tipo: 'ine_reverso',
          nombre_archivo: 'INE Reverso',
          archivo_url: uploadedFiles.ine_reverso,
          verificado: false,
          fecha_subida: new Date().toISOString()
        })
      }

      if (uploadedFiles.comprobante_domicilio) {
        docsToUpdate.push({
          coach_id: coachId,
          tipo: 'comprobante_domicilio',
          nombre_archivo: 'Comprobante de Domicilio',
          archivo_url: uploadedFiles.comprobante_domicilio,
          verificado: false,
          fecha_subida: new Date().toISOString()
        })
      }

      if (docsToUpdate.length > 0) {
        // Eliminar documentos antiguos del mismo tipo
        for (const doc of docsToUpdate) {
          await supabase
            .from('coach_documents')
            .delete()
            .eq('coach_id', coachId)
            .eq('tipo', doc.tipo)
        }

        // Insertar nuevos documentos
        const { error: docsError } = await supabase
          .from('coach_documents')
          .insert(docsToUpdate)

        if (docsError) {
          console.error('⚠️ [UPDATE PROFILE API] Error actualizando documentos:', docsError)
        } else {
          console.log('✅ [UPDATE PROFILE API] Documentos actualizados')
        }
      }
    }

    // ========================================
    // 5. ACTUALIZAR CERTIFICACIONES SI HAY
    // ========================================
    if (formData.certificaciones && formData.certificaciones.length > 0) {
      console.log('📜 [UPDATE PROFILE API] Actualizando certificaciones...')

      // Eliminar certificaciones antiguas
      await supabase
        .from('coach_certifications')
        .delete()
        .eq('coach_id', coachId)

      const certificaciones = await Promise.all(
        formData.certificaciones.map(async (cert) => {
          let archivoUrl = cert.archivo

          // Si es un archivo nuevo (data URL), subirlo
          if (cert.archivo && typeof cert.archivo === 'string' && cert.archivo.startsWith('data:')) {
            archivoUrl = await uploadFile(
              cert.archivo,
              'documents',
              'coaches',
              'cert.pdf'
            )
          }

          return {
            coach_id: coachId,
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
        console.error('⚠️ [UPDATE PROFILE API] Error actualizando certificaciones:', certError)
      } else {
        console.log('✅ [UPDATE PROFILE API] Certificaciones actualizadas')
      }
    }

    console.log('✅ [UPDATE PROFILE API] Perfil actualizado completamente')

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente'
    })

  } catch (error) {
    console.error('❌ [UPDATE PROFILE API] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar perfil: ' + error.message },
      { status: 500 }
    )
  }
}
