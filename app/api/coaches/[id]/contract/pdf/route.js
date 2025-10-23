import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateCoachContractPDF } from '@/lib/pdf/contract-generator'

export async function GET(request, { params }) {
  try {
    const { id: coachId } = params

    console.log('📄 [API] Generando PDF para coach:', coachId)

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(coachId)) {
      return NextResponse.json(
        { error: 'ID de coach inválido' },
        { status: 400 }
      )
    }

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

    // Obtener datos del coach
    console.log('🔍 [API] Buscando datos del coach...')
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

    // Obtener contrato vigente
    console.log('🔍 [API] Buscando contrato vigente...')
    const { data: contract, error: contractError } = await supabase
      .from('coach_contracts')
      .select('*')
      .eq('coach_id', coachId)
      .eq('vigente', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (contractError || !contract) {
      console.error('❌ [API] Contrato no encontrado:', contractError)
      return NextResponse.json(
        { error: 'No se encontró un contrato vigente para este coach' },
        { status: 404 }
      )
    }

    console.log('✅ [API] Contrato encontrado, generando PDF...')

    // Generar PDF
    const pdfBytes = await generateCoachContractPDF(coachData, contract)

    console.log('✅ [API] PDF generado exitosamente')

    // Retornar PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-${coachData.nombre}-${coachData.apellidos}.pdf"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (error) {
    console.error('❌ [API] Error generando PDF:', error)
    return NextResponse.json(
      { error: 'Error al generar el PDF: ' + error.message },
      { status: 500 }
    )
  }
}
