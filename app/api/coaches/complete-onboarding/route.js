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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nombre: formData.nombre,
          apellidos: formData.apellidos
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Error creando usuario: ' + authError.message },
        { status: 400 }
      )
    }

    const userId = authData.user.id
    console.log('✅ [API] Usuario creado:', userId)

    // 3. ESPERAR a que profile exista
    console.log('⏳ [API] Esperando creación de profile...')
    let profileExists = false
    let attempts = 0
    
    while (!profileExists && attempts < 10) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (profile) {
        profileExists = true
        console.log('✅ [API] Profile verificado')
      } else {
        attempts++
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    if (!profileExists) {
      return NextResponse.json(
        { error: 'Error creando perfil de usuario' },
        { status: 500 }
      )
    }

    // 4. Actualizar profile
    console.log('📝 [API] Actualizando perfil...')
    await supabase
      .from('profiles')
      .update({
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        rol: 'coach',
        foto_url: formData.foto_perfil || null
      })
      .eq('id', userId)

    // 5. Crear coach
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

    // 6. Subir archivos
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
          const ext = file.match(/data:image\/(\w+);/)?.[1] || 'png'
          const filename = `${userId}/${key}_${Date.now()}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filename, buffer, {
              contentType: `image/${ext}`,
              upsert: false
            })

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(filename)
            uploadedFiles[key] = urlData.publicUrl
          }
        } catch (err) {
          console.error(`⚠️ Error subiendo ${key}:`, err)
        }
      }
    }

    // 7. Guardar referencias de documentos
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
      await supabase.from('coach_documents').insert(documentos)
    }

    // 8. Generar PDF del contrato
    console.log('📄 [API] Generando PDF...')
    let pdfUrl = null

    try {
      const { generateCoachContractPDF } = await import('@/lib/pdf/contractGenerator')
      
      let contenidoTemplate = ''
      
      if (formData.template_id) {
        const { data: template } = await supabase
          .from('contract_templates')
          .select('contenido')
          .eq('id', formData.template_id)
          .single()
        
        if (template) {
          contenidoTemplate = template.contenido
            .replace(/\{nombre\}/g, formData.nombre)
            .replace(/\{apellidos\}/g, formData.apellidos)
            .replace(/\{fecha_inicio\}/g, new Date().toLocaleDateString('es-MX', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            }))
            .replace(/\{tipo_contrato\}/g, 'Por Clase')
        }
      }

      if (!contenidoTemplate) {
        contenidoTemplate = `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

Entre STRIVE STUDIO y ${formData.nombre} ${formData.apellidos}, se celebra el presente contrato.

I. OBJETO
Impartir clases de cycling según horario acordado.

II. COMPENSACIÓN
Pago por clase impartida.

III. ACEPTACIÓN
Al firmar, el coach acepta todos los términos.`
      }
      
      const pdfBlob = await generateCoachContractPDF({
        coach: {
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          rfc: formData.rfc
        },
        contrato: {
          tipo_contrato: 'por_clase',
          fecha_inicio: new Date().toISOString(),
          fecha_firma: new Date().toISOString()
        },
        contenidoTemplate,
        firmaEmbebida: formData.firma_digital
      })

      const pdfPath = `contracts/${userId}/${Date.now()}_contrato.pdf`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(pdfPath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(pdfPath)
        pdfUrl = urlData.publicUrl
        console.log('✅ [API] PDF generado')
      }
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF:', pdfError)
    }

    // 9. Crear contrato
    console.log('📄 [API] Creando contrato...')
    await supabase
      .from('coach_contracts')
      .insert({
        coach_id: userId,
        template_id: formData.template_id || null,
        tipo_contrato: 'por_clase',
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: 'activo',
        firmado: true,
        fecha_firma: new Date().toISOString(),
        firma_embebida: formData.firma_digital,
        vigente: true,
        version: 1,
        documento_url: pdfUrl
      })

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