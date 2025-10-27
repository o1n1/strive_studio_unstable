import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const maxDuration = 60

export async function POST(request) {
  try {
    console.log('🚀 [API] Iniciando proceso de onboarding completo...')

    const body = await request.json()
    const { token, formData, invitacionId } = body

    if (!token || !formData || !invitacionId) {
      return NextResponse.json(
        { error: 'Token, formData e invitacionId son requeridos' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Verificar invitación
    console.log('🔍 [API] Verificando invitación...')
    const { data: invitation, error: invError } = await supabase
      .from('coach_invitations')
      .select('*')
      .eq('id', invitacionId)
      .eq('token', token)
      .eq('estado', 'pendiente')
      .single()

    if (invError || !invitation) {
      console.error('❌ [API] Invitación inválida:', invError)
      return NextResponse.json(
        { error: 'Invitación inválida o expirada' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Invitación válida')

    // 2. Crear usuario en auth.users
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
      console.error('❌ [API] Error creando usuario:', authError)
      return NextResponse.json(
        { error: 'Error creando usuario: ' + authError.message },
        { status: 400 }
      )
    }

    const userId = authData.user.id
    console.log('✅ [API] Usuario creado:', userId)

    // 3. Actualizar profile
    console.log('📝 [API] Actualizando perfil...')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        rol: 'coach',
        foto_url: formData.foto_perfil || null
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ [API] Error actualizando perfil:', profileError)
    }

    // 4. Crear registro de coach (solo campos que existen)
    console.log('🏋️ [API] Creando registro de coach...')
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
        { error: 'Error creando registro de coach: ' + coachError.message },
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
      if (file && file.startsWith('data:')) {
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
          console.error(`⚠️ [API] Error subiendo ${key}:`, err)
        }
      }
    }

    console.log('✅ [API] Archivos procesados')

    // 6. Guardar documentos
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

    // 7. Generar PDF del contrato
    console.log('📄 [API] Generando PDF del contrato...')
    let pdfUrl = null

    try {
      const { generateCoachContractPDF } = await import('@/lib/pdf/contractGenerator')
      
      let contenidoTemplate = ''
      
      if (formData.template_id) {
        console.log('🔍 [API] Obteniendo template:', formData.template_id)
        const { data: template, error: templateError } = await supabase
          .from('contract_templates')
          .select('contenido')
          .eq('id', formData.template_id)
          .single()
        
        if (!templateError && template) {
          const reemplazos = {
            '{nombre}': formData.nombre,
            '{apellidos}': formData.apellidos,
            '{fecha_inicio}': new Date().toLocaleDateString('es-MX', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            '{tipo_contrato}': 'Por Clase'
          }
          
          contenidoTemplate = template.contenido
          Object.keys(reemplazos).forEach(key => {
            contenidoTemplate = contenidoTemplate.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), reemplazos[key])
          })
          
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
        firmaEmbebida: formData.firma_digital
      })

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
El pago se realizará según el esquema por clase impartida.

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

    // 8. Crear registro de contrato
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
        firma_embebida: formData.firma_digital,
        vigente: true,
        version: 1,
        documento_url: pdfUrl
      })

    if (contratoError) {
      console.error('⚠️ [API] Error creando contrato:', contratoError)
    } else {
      console.log('✅ [API] Contrato creado')
    }

    // 9. Marcar invitación como usada
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