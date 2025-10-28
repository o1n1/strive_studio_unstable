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

    // 2. Crear usuario con rol='coach' en metadatos
    console.log('👤 [API] Creando usuario con rol=coach...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          telefono: formData.telefono,
          rol: 'coach', // 🔥 EL TRIGGER LEERÁ ESTE ROL
          avatar_url: formData.foto_perfil || null
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

    // 3. Esperar a que el trigger cree el profile
    console.log('⏳ [API] Esperando creación automática de profile...')
    let profileExists = false
    let attempts = 0
    
    while (!profileExists && attempts < 10) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, rol')
        .eq('id', userId)
        .single()
      
      if (profile && profile.rol === 'coach') {
        profileExists = true
        console.log('✅ [API] Profile creado automáticamente por trigger con rol=coach')
      } else if (profile && profile.rol !== 'coach') {
        console.error('❌ [API] Profile creado pero con rol incorrecto:', profile.rol)
        return NextResponse.json(
          { error: 'Error: Profile creado con rol incorrecto. Verifica el trigger en Supabase.' },
          { status: 500 }
        )
      } else {
        attempts++
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    if (!profileExists) {
      return NextResponse.json(
        { error: 'Error: Profile no fue creado por el trigger. Verifica la configuración en Supabase.' },
        { status: 500 }
      )
    }

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
        años_experiencia: formData.años_experiencia ? parseInt(formData.años_experiencia) : 0,
        especialidades: formData.especialidades || [],
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        tiktok: formData.tiktok || null,
        banco: formData.banco || null,
        clabe: formData.clabe || null,
        titular_cuenta: formData.titular_cuenta || null,
        estado: 'pendiente',
        activo: false,
        es_head_coach: false,
        categoria: null
      })

    if (coachError) {
      console.error('❌ [API] Error creando coach:', coachError)
      return NextResponse.json(
        { error: 'Error creando coach: ' + coachError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Coach creado')

    // 5. Subir documentos
    console.log('📄 [API] Subiendo documentos...')
    const documentos = [
      { nombre: 'INE Frente', file: formData.ine_frente, tipo: 'ine_frente' },
      { nombre: 'INE Reverso', file: formData.ine_reverso, tipo: 'ine_reverso' },
      { nombre: 'Comprobante Domicilio', file: formData.comprobante_domicilio, tipo: 'comprobante_domicilio' }
    ]

    for (const doc of documentos) {
      if (!doc.file) {
        console.log(`⏭️ [API] ${doc.nombre} no proporcionado, omitiendo...`)
        continue
      }

      const fileName = `${userId}/${doc.tipo}_${Date.now()}.${doc.file.split(';')[0].split('/')[1]}`
      const base64Data = doc.file.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')

      const { error: uploadError } = await supabase.storage
        .from('coach_documents')
        .upload(fileName, buffer, {
          contentType: doc.file.split(';')[0].split(':')[1],
          upsert: false
        })

      if (uploadError) {
        console.error(`❌ [API] Error subiendo ${doc.nombre}:`, uploadError)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('coach_documents')
        .getPublicUrl(fileName)

      await supabase.from('coach_documents').insert({
        coach_id: userId,
        tipo: doc.tipo,
        archivo_url: urlData.publicUrl,
        verificado: false
      })

      console.log(`✅ [API] ${doc.nombre} subido`)
    }

    // 6. Subir certificaciones
    console.log('🎓 [API] Subiendo certificaciones...')
    if (formData.certificaciones && formData.certificaciones.length > 0) {
      for (const cert of formData.certificaciones) {
        if (!cert.archivo) continue

        const fileName = `${userId}/certificacion_${Date.now()}.${cert.archivo.split(';')[0].split('/')[1]}`
        const base64Data = cert.archivo.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')

        const { error: uploadError } = await supabase.storage
          .from('coach_documents')
          .upload(fileName, buffer, {
            contentType: cert.archivo.split(';')[0].split(':')[1],
            upsert: false
          })

        if (uploadError) {
          console.error('❌ [API] Error subiendo certificación:', uploadError)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('coach_documents')
          .getPublicUrl(fileName)

        await supabase.from('coach_certifications').insert({
          coach_id: userId,
          nombre: cert.nombre,
          institucion: cert.institucion,
          fecha_obtencion: cert.fecha_obtencion,
          archivo_url: urlData.publicUrl,
          verificado: false
        })

        console.log(`✅ [API] Certificación "${cert.nombre}" subida`)
      }
    }

    // 7. Generar y subir contrato PDF
    console.log('📝 [API] Generando contrato PDF...')

    // Obtener template activo
    const { data: template } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('activo', true)
      .single()

    if (!template) {
      console.error('❌ [API] No hay template de contrato activo')
      return NextResponse.json(
        { error: 'No hay plantilla de contrato configurada' },
        { status: 500 }
      )
    }

    // Reemplazar variables en el template
    let contenidoContrato = template.contenido
      .replace(/{nombre}/g, formData.nombre)
      .replace(/{apellidos}/g, formData.apellidos)
      .replace(/{fecha_inicio}/g, new Date().toLocaleDateString('es-MX'))
      .replace(/{tipo_contrato}/g, 'Por Clase')

    // Generar PDF con firma embebida
    const PDFDocument = (await import('pdfkit')).default
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' })
    const chunks = []

    doc.on('data', chunk => chunks.push(chunk))

    // Agregar contenido del contrato
    doc.fontSize(10).text(contenidoContrato, { align: 'justify' })
    doc.moveDown(2)

    // Agregar firma
    if (formData.firma_digital) {
      doc.text('Firma del Coach:', { underline: true })
      doc.moveDown(0.5)
      
      const firmaBuffer = Buffer.from(formData.firma_digital.split(',')[1], 'base64')
      doc.image(firmaBuffer, { fit: [200, 50], align: 'center' })
      doc.moveDown(0.5)
    }

    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' })
    doc.end()

    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // Subir PDF a storage
    const contractFileName = `${userId}/contrato_${Date.now()}.pdf`
    const { error: pdfUploadError } = await supabase.storage
      .from('coach_documents')
      .upload(contractFileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (pdfUploadError) {
      console.error('❌ [API] Error subiendo PDF:', pdfUploadError)
    } else {
      const { data: pdfUrlData } = supabase.storage
        .from('coach_documents')
        .getPublicUrl(contractFileName)

      await supabase.from('coach_contracts').insert({
        coach_id: userId,
        tipo_contrato: 'por_clase',
        fecha_inicio: new Date().toISOString().split('T')[0],
        archivo_contrato_url: pdfUrlData.publicUrl,
        estado: 'pendiente'
      })

      console.log('✅ [API] Contrato PDF generado y guardado')
    }

    // 8. Marcar invitación como usada
    await supabase
      .from('coach_invitations')
      .update({ 
        estado: 'aceptada',
        fecha_aceptacion: new Date().toISOString()
      })
      .eq('id', invitacionId)

    console.log('✅ [API] Onboarding completado exitosamente')

    return NextResponse.json({
      success: true,
      userId,
      message: 'Onboarding completado. Tu solicitud está en revisión.'
    })

  } catch (error) {
    console.error('❌ [API] Error en onboarding:', error)
    return NextResponse.json(
      { error: error.message || 'Error procesando solicitud' },
      { status: 500 }
    )
  }
}