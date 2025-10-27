import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('🚀 [API] Iniciando complete-onboarding...')

    const body = await request.json()
    const { token, formData, invitacionId } = body

    console.log('🔍 [API] Token:', token)
    console.log('🔍 [API] Email:', formData?.email)
    console.log('🔍 [API] Template ID recibido:', formData?.template_id)

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
        const filePath = `${folder}/${userId}/${Date.now()}_${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, fileToUpload, {
            contentType: fileToUpload.type || 'application/octet-stream',
            upsert: false
          })

        if (uploadError) {
          console.error('⚠️ [API] Error subiendo archivo:', uploadError)
          return null
        }

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        return urlData.publicUrl
      } catch (error) {
        console.error('⚠️ [API] Error en uploadFile:', error)
        return null
      }
    }

    // Subir foto de perfil
    if (formData.foto_perfil) {
      console.log('📸 [API] Subiendo foto de perfil...')
      uploadedFiles.foto_perfil = await uploadFile(
        formData.foto_perfil,
        'avatars',
        'coaches',
        'profile.jpg'
      )
      console.log('✅ [API] Foto de perfil subida')
    }

    // Subir documentos
    if (formData.ine_frente) {
      console.log('📄 [API] Subiendo INE frente...')
      uploadedFiles.ine_frente = await uploadFile(
        formData.ine_frente,
        'documents',
        'coaches',
        'ine_frente.jpg'
      )
    }

    if (formData.ine_reverso) {
      console.log('📄 [API] Subiendo INE reverso...')
      uploadedFiles.ine_reverso = await uploadFile(
        formData.ine_reverso,
        'documents',
        'coaches',
        'ine_reverso.jpg'
      )
    }

    if (formData.comprobante_domicilio) {
      console.log('📄 [API] Subiendo comprobante de domicilio...')
      uploadedFiles.comprobante_domicilio = await uploadFile(
        formData.comprobante_domicilio,
        'documents',
        'coaches',
        'comprobante_domicilio.pdf'
      )
    }

    console.log('✅ [API] Archivos subidos')

    // 4. Crear profile
    console.log('👤 [API] Creando profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono,
        rol: 'coach',
        avatar_url: uploadedFiles.foto_perfil || null
      })

    if (profileError) {
      console.error('❌ [API] Error creando profile:', profileError)
      return NextResponse.json(
        { error: 'Error al crear perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Profile creado')

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

    // 8. Generar PDF del contrato con contenido de template
    console.log('📄 [API] Generando PDF del contrato...')
    let pdfUrl = null

    try {
      const { generateCoachContractPDF } = await import('@/lib/pdf/contractGenerator')
      
      // Obtener contenido del template si existe template_id
      let contenidoTemplate = ''
      
      if (formData.template_id) {
        console.log('🔍 [API] Obteniendo template:', formData.template_id)
        const { data: template, error: templateError } = await supabase
          .from('contract_templates')
          .select('contenido')
          .eq('id', formData.template_id)
          .single()
        
        if (!templateError && template) {
          // Personalizar variables del template
          const nombreCompleto = `${formData.nombre} ${formData.apellidos}`
          const fechaInicio = new Date().toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
          const fechaFirma = new Date().toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
          const categoria = invitation?.categoria || 'No especificada'
          
          contenidoTemplate = template.contenido
            .replace(/\{\{nombre_completo\}\}/g, nombreCompleto)
            .replace(/\{\{fecha_inicio\}\}/g, fechaInicio)
            .replace(/\{\{fecha_firma\}\}/g, fechaFirma)
            .replace(/\{\{categoria\}\}/g, categoria)
          
          console.log('✅ [API] Template personalizado')
        } else {
          console.warn('⚠️ [API] No se pudo obtener template, usando fallback')
          contenidoTemplate = getFallbackContent(formData, invitation)
        }
      } else {
        console.log('ℹ️ [API] Sin template_id, usando contenido fallback')
        contenidoTemplate = getFallbackContent(formData, invitation)
      }
      
      const contratoTemp = {
        id: crypto.randomUUID(),
        tipo_contrato: 'por_clase',
        fecha_inicio: new Date().toISOString(),
        fecha_firma: new Date().toISOString()
      }

      const pdfBlob = await generateCoachContractPDF({
        coach: {
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          rfc: formData.rfc
        },
        contrato: contratoTemp,
        contenidoTemplate: contenidoTemplate,
        firmaEmbebida: formData.firma_digital // Firma en base64
      })

      // Subir PDF a storage
      const pdfPath = `contracts/${userId}/${Date.now()}_contrato_v1.pdf`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(pdfPath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (uploadError) {
        console.error('⚠️ [API] Error subiendo PDF:', uploadError)
      } else {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(pdfPath)
        pdfUrl = urlData.publicUrl
        console.log('✅ [API] PDF generado y subido')
      }
    } catch (pdfError) {
      console.error('⚠️ [API] Error generando PDF:', pdfError)
    }

    // Función helper para contenido fallback
    function getFallbackContent(formData, invitation) {
      const nombreCompleto = `${formData.nombre} ${formData.apellidos}`
      const fechaInicio = new Date().toLocaleDateString('es-MX')
      const categoria = invitation?.categoria || 'No especificada'
      
      return `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

    Entre STRIVE STUDIO (en adelante "EL ESTUDIO") y ${nombreCompleto} (en adelante "EL INSTRUCTOR/COACH"), se celebra el presente contrato bajo los siguientes términos:

    I. OBJETO DEL CONTRATO
    EL INSTRUCTOR/COACH prestará servicios profesionales de coaching deportivo en las instalaciones de EL ESTUDIO, impartiendo clases de ${categoria} según el horario acordado.

    II. OBLIGACIONES DEL INSTRUCTOR/COACH
    1. Impartir clases con profesionalismo, puntualidad y calidad excepcional.
    2. Mantener vigentes todas las certificaciones profesionales requeridas.
    3. Cumplir con los protocolos de seguridad e higiene del estudio.
    4. Respetar la confidencialidad de información sensible de clientes y operaciones.

    III. OBLIGACIONES DEL ESTUDIO
    1. Proporcionar instalaciones adecuadas y equipamiento necesario.
    2. Realizar pagos según lo acordado en tiempo y forma.
    3. Cubrir seguros de responsabilidad civil durante las clases.

    IV. COMPENSACIÓN
    El pago se realizará según el esquema establecido (por clase, hora o mensual) acordado con la administración.

    V. TERMINACIÓN
    Cualquiera de las partes puede terminar este contrato con 15 días de anticipación mediante aviso por escrito.

    VI. CONFIDENCIALIDAD
    EL INSTRUCTOR/COACH se compromete a mantener confidencialidad sobre información sensible del negocio, clientes y operaciones del estudio.

    VII. ACEPTACIÓN
    Al firmar este contrato, EL INSTRUCTOR/COACH acepta haber leído, comprendido y estar de acuerdo con todos los términos establecidos.

    Fecha de inicio: ${fechaInicio}
    Categoría: ${categoria}
    Tipo de compensación: Por Clase`
    }

    // 9. Crear registro de contrato con template_id y firma_embebida
    console.log('📄 [API] Creando contrato firmado...')
    const { error: contratoError } = await supabase
      .from('coach_contracts')
      .insert({
        coach_id: userId,
        template_id: formData.template_id || null,
        tipo_contrato: 'por_clase',
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: 'activo',
        firmado: true,
        fecha_firma: new Date().toISOString(),
        firma_embebida: formData.firma_digital, // Firma en base64 PNG
        vigente: true,
        version: 1,
        documento_url: pdfUrl
      })

    if (contratoError) {
      console.error('⚠️ [API] Error creando contrato:', contratoError)
    } else {
      console.log('✅ [API] Contrato creado con template_id y firma embebida')
    }

    // 10. Marcar invitación como usada
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