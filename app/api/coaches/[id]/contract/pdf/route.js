import { NextResponse } from 'next/server'

// ✅ IMPORTANTE: Envolver TODA la lógica en un try-catch global
export async function GET(request, { params }) {
  // Try-catch GLOBAL para capturar TODO
  try {
    console.log('📄 [PDF API] ========== INICIO ==========')
    console.log('📄 [PDF API] Params recibidos:', JSON.stringify(params))
    
    const { id: coachId } = params || {}
    
    if (!coachId) {
      console.error('❌ [PDF API] No se recibió coachId en params')
      return NextResponse.json(
        { error: 'ID de coach no proporcionado' },
        { status: 400 }
      )
    }

    console.log('📄 [PDF API] Coach ID:', coachId)

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(coachId)) {
      console.error('❌ [PDF API] UUID inválido:', coachId)
      return NextResponse.json(
        { error: 'ID de coach inválido' },
        { status: 400 }
      )
    }

    console.log('✅ [PDF API] UUID válido')

    // Verificar variables de entorno
    console.log('🔍 [PDF API] Verificando variables de entorno...')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      console.error('❌ [PDF API] NEXT_PUBLIC_SUPABASE_URL no configurada')
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta (URL)' },
        { status: 500 }
      )
    }

    if (!supabaseKey) {
      console.error('❌ [PDF API] SUPABASE_SERVICE_ROLE_KEY no configurada')
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta (KEY)' },
        { status: 500 }
      )
    }

    console.log('✅ [PDF API] Variables de entorno OK')
    console.log('📍 [PDF API] Supabase URL:', supabaseUrl)

    // Importar Supabase dinámicamente
    console.log('📦 [PDF API] Importando Supabase client...')
    const { createClient } = await import('@supabase/supabase-js')
    
    // Crear cliente Supabase
    console.log('🔧 [PDF API] Creando cliente Supabase...')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('✅ [PDF API] Cliente Supabase creado')

    // Obtener datos del coach
    console.log('🔍 [PDF API] Buscando coach en BD...')
    const { data: coachData, error: coachError } = await supabase
      .from('coaches_complete')
      .select('*')
      .eq('id', coachId)
      .maybeSingle()

    if (coachError) {
      console.error('❌ [PDF API] Error en query de coach:', coachError)
      return NextResponse.json(
        { error: 'Error al buscar coach: ' + coachError.message },
        { status: 500 }
      )
    }

    if (!coachData) {
      console.error('❌ [PDF API] Coach no encontrado con ID:', coachId)
      return NextResponse.json(
        { error: 'Coach no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [PDF API] Coach encontrado:', coachData.nombre, coachData.apellidos)
    console.log('📧 [PDF API] Email del coach:', coachData.email)

    // Obtener contrato vigente
    console.log('🔍 [PDF API] Buscando contrato vigente...')
    const { data: contracts, error: contractError } = await supabase
      .from('coach_contracts')
      .select('*')
      .eq('coach_id', coachId)
      .eq('vigente', true)
      .order('created_at', { ascending: false })

    if (contractError) {
      console.error('❌ [PDF API] Error en query de contrato:', contractError)
      return NextResponse.json(
        { error: 'Error al buscar contrato: ' + contractError.message },
        { status: 500 }
      )
    }

    console.log('📊 [PDF API] Contratos encontrados:', contracts?.length || 0)

    if (!contracts || contracts.length === 0) {
      console.error('❌ [PDF API] No hay contratos vigentes para este coach')
      return NextResponse.json(
        { error: 'No se encontró un contrato vigente para este coach' },
        { status: 404 }
      )
    }

    const contract = contracts[0]
    console.log('✅ [PDF API] Contrato seleccionado:', contract.id)
    console.log('📄 [PDF API] Tipo contrato:', contract.tipo_contrato)
    console.log('📅 [PDF API] Fecha inicio:', contract.fecha_inicio)
    console.log('✍️ [PDF API] Firmado:', contract.firmado)

    // Importar generador de PDF dinámicamente
    console.log('📦 [PDF API] Importando generador de PDF...')
    let generateCoachContractPDF
    try {
      const pdfModule = await import('@/lib/pdf/contract-generator')
      generateCoachContractPDF = pdfModule.generateCoachContractPDF
      console.log('✅ [PDF API] Generador de PDF importado')
    } catch (importError) {
      console.error('❌ [PDF API] Error importando generador:', importError)
      console.error('❌ [PDF API] Import error stack:', importError.stack)
      return NextResponse.json(
        { 
          error: 'Error al cargar el generador de PDF', 
          details: importError.message 
        },
        { status: 500 }
      )
    }

    // Generar PDF
    console.log('🎨 [PDF API] Generando PDF...')
    let pdfBytes
    try {
      pdfBytes = await generateCoachContractPDF(coachData, contract)
      console.log('✅ [PDF API] PDF generado')
    } catch (pdfError) {
      console.error('❌ [PDF API] Error en generateCoachContractPDF:', pdfError)
      console.error('❌ [PDF API] PDF error stack:', pdfError.stack)
      return NextResponse.json(
        { 
          error: 'Error al generar el PDF', 
          details: pdfError.message 
        },
        { status: 500 }
      )
    }

    // Validar que el PDF se generó correctamente
    if (!pdfBytes) {
      console.error('❌ [PDF API] PDF generado es null/undefined')
      return NextResponse.json(
        { error: 'Error: PDF generado está vacío' },
        { status: 500 }
      )
    }

    if (pdfBytes.length === 0) {
      console.error('❌ [PDF API] PDF generado tiene tamaño 0')
      return NextResponse.json(
        { error: 'Error: PDF generado está vacío (0 bytes)' },
        { status: 500 }
      )
    }

    console.log('✅ [PDF API] PDF válido, tamaño:', pdfBytes.length, 'bytes')

    // Preparar nombre del archivo
    const filename = `contrato-${coachData.nombre}-${coachData.apellidos}.pdf`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-zA-Z0-9.-]/g, '-') // Reemplazar caracteres especiales

    console.log('📦 [PDF API] Nombre archivo:', filename)

    // Retornar PDF
    console.log('✅ [PDF API] Retornando PDF al cliente...')
    console.log('📄 [PDF API] ========== FIN EXITOSO ==========')
    
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (globalError) {
    // ✅ CATCH GLOBAL - Captura TODO lo que no se capturó antes
    console.error('💥 [PDF API] ========== ERROR CRÍTICO ==========')
    console.error('❌ [PDF API] Error no capturado:', globalError)
    console.error('❌ [PDF API] Error message:', globalError.message)
    console.error('❌ [PDF API] Error stack:', globalError.stack)
    console.error('💥 [PDF API] ========================================')
    
    // ✅ SIEMPRE retornar JSON, NUNCA dejar que Next.js devuelva HTML
    return NextResponse.json(
      { 
        error: 'Error crítico en el servidor', 
        message: globalError.message,
        type: globalError.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? globalError.stack : undefined
      },
      { status: 500 }
    )
  }
}
