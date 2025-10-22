import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profile?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { coachId, tipo_contrato, sueldo_base, comision_por_clase, notas } = body

    // 1. Obtener contrato vigente y datos del coach
    const { data: contratoActual } = await supabase
      .from('coach_contracts')
      .select('*')
      .eq('coach_id', coachId)
      .eq('vigente', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const { data: coachData } = await supabase
      .from('coaches_complete')
      .select('*')
      .eq('id', coachId)
      .single()

    if (!coachData) {
      return NextResponse.json({ error: 'Coach no encontrado' }, { status: 404 })
    }

    const nuevaVersion = contratoActual ? contratoActual.version + 1 : 1

    // 2. Generar PDF del nuevo contrato
    const { generateCoachContractPDF } = await import('@/lib/pdf/contractGenerator')
    
    const nuevoContratoTemp = {
      id: crypto.randomUUID(),
      tipo_contrato: tipo_contrato || 'por_clase',
      fecha_inicio: new Date().toISOString(),
      fecha_firma: new Date().toISOString()
    }

    const pdfBlob = await generateCoachContractPDF({
      coach: coachData,
      contrato: nuevoContratoTemp,
      firmaDigital: null // Renovación sin firma digital
    })

    // 3. Subir PDF
    const pdfPath = `contracts/${coachId}/${Date.now()}_contrato_v${nuevaVersion}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(pdfPath)

    // 4. Marcar contrato anterior como no vigente
    if (contratoActual) {
      await supabase
        .from('coach_contracts')
        .update({ vigente: false })
        .eq('id', contratoActual.id)
    }

    // 5. Crear nuevo contrato
    const { data: nuevoContrato, error: contratoError } = await supabase
      .from('coach_contracts')
      .insert({
        coach_id: coachId,
        tipo_contrato: tipo_contrato || 'por_clase',
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: 'activo',
        firmado: false,
        vigente: true,
        version: nuevaVersion,
        reemplaza_a: contratoActual?.id || null,
        documento_url: urlData.publicUrl,
        sueldo_base: sueldo_base || null,
        comision_por_clase: comision_por_clase || null,
        notas: notas || null
      })
      .select()
      .single()

    if (contratoError) throw contratoError

    return NextResponse.json({
      success: true,
      contrato: nuevoContrato
    })

  } catch (error) {
    console.error('Error renovando contrato:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
