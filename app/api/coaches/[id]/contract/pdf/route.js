import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateCoachContractPDF } from '@/lib/pdf/contract-generator'

export async function GET(request, { params }) {
  try {
    const { id: coachId } = params

    console.log('📄 [API PDF] Generando PDF para coach:', coachId)

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(coachId)) {
      console.error('❌ [API PDF] UUID inválido:', coachId)
      return NextResponse.json(
        { error: 'ID de coach inválido' },
        { status: 400 }
      )
    }

    // ✅ VERIFICAR que las variables de entorno existen
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ [API PDF] Variables de entorno faltantes')
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
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
    console.log('🔍 [API PDF] Buscando datos del coach...')
    const { data: coachData, error: coachError } = await supabase
      .from('coaches_complete')
      .select('*')
      .eq('id', coachId)
      .single()

    if (coachError) {
      console.error('❌ [API PDF] Error buscando coach:', coachError)
      return NextResponse.json(
        { error: 'Coach no encontrado: ' + coachError.message },
        { status: 404 }
      )
    }

    if (!coachData) {
      console.error('❌ [API PDF] Coach no existe:', coachId)
      return NextResponse.json(
        { error: 'Coach no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [API PDF] Coach encontrado:', coachData.nombre)

    // Obtener contrato vigente
    console.log('🔍 [API PDF] Buscando contrato vigente...')
    const { data: contracts, error: contractError } = await supabase
      .from('coach_contracts')
      .select('*')
      .eq('coach_id', coachId)
      .eq('vigente', true)
      .order('created_at', { ascending: false })

    if (contractError) {
      console.error('❌ [API PDF] Error buscando contrato:', contractError)
      return NextResponse.json(
        { error: 'Error al buscar contrato: ' + contractError.message },
        { status: 500 }
      )
    }

    if (!contracts || contracts.length === 0) {
      console.error('❌ [API PDF] No hay contrato vigente para:', coachId)
      return NextResponse.json(
        { error: 'No se encontró un contrato vigente para este coach' },
        { status: 404 }
      )
    }

    const contract = contracts[0]
    console.log('✅ [API PDF] Contrato encontrado:', contract.id)

    // Generar PDF
    console.log('📄 [API PDF] Generando PDF del contrato...')
    const pdfBytes = await generateCoachContractPDF(coachData, contract)

    if (!pdfBytes || pdfBytes.length === 0) {
      console.error('❌ [API PDF] PDF generado está vacío')
      return NextResponse.json(
        { error: 'Error al generar el PDF - archivo vacío' },
        { status: 500 }
      )
    }

    console.log('✅ [API PDF] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes')

    // Retornar PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-${coachData.nombre}-${coachData.apellidos}.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (error) {
    console.error('❌ [API PDF] Error crítico generando PDF:', error)
    console.error('❌ [API PDF] Stack trace:', error.stack)
    
    // ✅ Retornar JSON de error, NO HTML
    return NextResponse.json(
      { 
        error: 'Error al generar el PDF', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
