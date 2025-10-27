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

    // 3. CREAR PROFILE MANUALMENTE (sin esperar trigger)
    console.log('👤 [API] Creando profile manualmente...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: formData.email,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        rol: 'coach',
        avatar_url: formData.foto_perfil || null,
        activo: true,
        require_email_verification: false
      })

    if (profileError) {
      console.error('❌ [API] Error creando profile:', profileError)
      return NextResponse.json(
        { error: 'Error creando perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Profile creado exitosamente')

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
    if (Object.keys(uploadedFiles).length > 0) {
      console.log('💾 [API] Guardando registros de documentos...')
      const docsToInsert = Object.entries(uploadedFiles).map(([tipo, url]) => ({
        coach_id: userId,
        tipo,
        nombre_archivo: tipo.replace('_', ' '),
        archivo_url: url,
        verificado: false
      }))

      await supabase.from('coach_documents').insert(docsToInsert)
      console.log('✅ [API] Documentos guardados')
    }

    // 7. Obtener template de contrato activo
    console.log('📄 [API] Buscando template de contrato...')
    const { data: template, error: templateError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('tipo_contrato', 'por_clase')
      .eq('vigente', true)
      .eq('es_default', true)
      .single()

    let contenidoContrato = 'CONTRATO DE PRESTACIÓN DE SERVICIOS\n\nEste contrato es entre Strive Studio y el coach.'
    
    if (!templateError && template) {
      console.log('✅ [API] Template encontrado:', template.nombre)
      // Reemplazar variables en el template
      contenidoContrato = template.contenido
        .replace(/\{nombre\}/g, formData.nombre)
        .replace(/\{apellidos\}/g, formData.apellidos)
        .replace(/\{fecha_inicio\}/g, new Date().toLocaleDateString('es-MX'))
        .replace(/\{tipo_contrato\}/g, 'Por Clase')
    } else {
      console.log('⚠️ [API] No se encontró template, usando contenido default')
    }

    // 8. Generar PDF del contrato
    console.log('📑 [API] Generando PDF...')
    let pdfUrl = null

    try {
      // Importar función de generación de PDF
      const { generateCoachContractPDF } = await import('@/lib/pdf/contract-generator')
      
      const pdfBuffer = await generateCoachContractPDF({
        contenido: contenidoContrato,
        firmaBase64: formData.firma_digital,
        nombreCompleto: `${formData.nombre} ${formData.apellidos}`,
        fecha: new Date().toLocaleDateString('es-MX')
      })

      // Subir PDF a storage
      const pdfFileName = `${userId}/contrato-${Date.now()}.pdf`
      const { error: uploadPdfError } = await supabase.storage
        .from('contracts')
        .upload(pdfFileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (uploadPdfError) throw uploadPdfError

      const { data: pdfPublicData } = supabase.storage
        .from('contracts')
        .getPublicUrl(pdfFileName)

      pdfUrl = pdfPublicData.publicUrl
      console.log('✅ [API] PDF generado y subido')
    } catch (pdfError) {
      console.error('⚠️ [API] Error generando PDF:', pdfError)
      // Continuar sin PDF si falla
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
        template_id: template?.id || null,
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