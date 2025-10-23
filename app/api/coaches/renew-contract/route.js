import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateCoachContractPDF } from '@/lib/pdf/contract-generator'
import crypto from 'crypto'

export async function POST(request) {
  try {
    console.log('📝 [API] Iniciando actualización de contrato...')

    // Validar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Cliente con Service Role Key
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

    // Verificar que es admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Obtener datos del body
    const body = await request.json()
    const {
      coachId,
      contratoId,
      tipo_contrato,
      fecha_inicio,
      fecha_fin,
      sueldo_base,
      comision_por_clase,
      notas,
      es_renovacion
    } = body

    console.log('📋 [API] Datos recibidos:', {
      coachId,
      contratoId,
      tipo_contrato,
      es_renovacion
    })

    // Validar campos requeridos
    if (!coachId || !tipo_contrato || !fecha_inicio) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Obtener datos completos del coach
    const { data: coachData, error: coachError } = await supabase
      .from('coaches_complete')
      .select('*')
      .eq('id', coachId)
      .single()

    if (coachError || !coachData) {
      console.error('❌ [API] Coach no encontrado:', coachError)
      return NextResponse.json(
        { error: 'Coach no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [API] Coach encontrado:', coachData.nombre)

    let nuevoContratoId
    let version = 1

    // Si es renovación, marcar contrato anterior como no vigente
    if (es_renovacion && contratoId) {
      console.log('🔄 [API] Renovación: marcando contrato anterior como no vigente...')
      
      // Obtener versión del contrato actual
      const { data: contratoAnterior } = await supabase
        .from('coach_contracts')
        .select('version')
        .eq('id', contratoId)
        .single()

      version = (contratoAnterior?.version || 0) + 1

      await supabase
        .from('coach_contracts')
        .update({ vigente: false })
        .eq('id', contratoId)

      console.log('✅ [API] Contrato anterior marcado como no vigente')
    }

    // Preparar datos del nuevo contrato
    const contratoData = {
      coach_id: coachId,
      tipo_contrato,
      fecha_inicio,
      fecha_fin: fecha_fin || null,
      sueldo_base: sueldo_base || null,
      comision_por_clase: comision_por_clase || null,
      notas: notas || null,
      estado: 'activo',
      firmado: false, // Admin no tiene firma del coach
      vigente: true,
      version: version
    }

    // Si NO es renovación y hay contratoId, es una actualización
    if (!es_renovacion && contratoId) {
      console.log('✏️ [API] Actualizando contrato existente...')
      
      const { error: updateError } = await supabase
        .from('coach_contracts')
        .update(contratoData)
        .eq('id', contratoId)

      if (updateError) {
        console.error('❌ [API] Error actualizando contrato:', updateError)
        return NextResponse.json(
          { error: 'Error al actualizar contrato: ' + updateError.message },
          { status: 500 }
        )
      }

      nuevoContratoId = contratoId
      console.log('✅ [API] Contrato actualizado')
    } else {
      // Crear nuevo contrato
      console.log('📄 [API] Creando nuevo contrato...')
      
      const { data: nuevoContrato, error: insertError } = await supabase
        .from('coach_contracts')
        .insert(contratoData)
        .select()
        .single()

      if (insertError) {
        console.error('❌ [API] Error creando contrato:', insertError)
        return NextResponse.json(
          { error: 'Error al crear contrato: ' + insertError.message },
          { status: 500 }
        )
      }

      nuevoContratoId = nuevoContrato.id
      console.log('✅ [API] Nuevo contrato creado:', nuevoContratoId)
    }

    // Generar PDF del contrato
    console.log('📄 [API] Generando PDF del contrato...')
    
    const contratoParaPDF = {
      id: nuevoContratoId,
      tipo_contrato,
      fecha_inicio,
      fecha_fin: fecha_fin || null,
      sueldo_base,
      comision_por_clase,
      estado: 'activo',
      firmado: false,
      version: version
    }

    const pdfBytes = await generateCoachContractPDF(coachData, contratoParaPDF)
    console.log('✅ [API] PDF generado')

    // Subir PDF a storage
    const pdfPath = `contracts/${coachId}/${Date.now()}_contrato_v${version}.pdf`
    console.log('📤 [API] Subiendo PDF a storage:', pdfPath)

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(pdfPath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('⚠️ [API] Error subiendo PDF:', uploadError)
    } else {
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(pdfPath)

      // Actualizar contrato con URL del documento
      await supabase
        .from('coach_contracts')
        .update({ 
          documento_url: urlData.publicUrl,
          hash_documento: crypto.createHash('sha256').update(pdfBytes).digest('hex')
        })
        .eq('id', nuevoContratoId)

      console.log('✅ [API] PDF subido y URL guardada')
    }

    console.log('🎉 [API] Contrato actualizado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Contrato actualizado exitosamente',
      contratoId: nuevoContratoId
    })

  } catch (error) {
    console.error('❌ [API] Error general:', error)
    return NextResponse.json(
      { error: 'Error al actualizar contrato: ' + error.message },
      { status: 500 }
    )
  }
}
