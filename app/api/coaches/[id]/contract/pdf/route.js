import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'

/**
 * API para generar PDF del contrato de un coach
 * Accesible por admins y por el coach dueño del contrato
 * 
 * @route GET /api/coaches/[id]/contract/pdf
 * @access Admin, Coach (solo su propio contrato)
 */
export const GET = withAuth(
  async (request, context) => {
    // Try-catch GLOBAL para capturar TODO
    try {
      const { user, profile, supabase } = context
      const { params } = context
      
      console.log('📄 [PDF API] ========== INICIO ==========')
      console.log('📄 [PDF API] Usuario:', profile.nombre, profile.apellidos, `(${profile.rol})`)
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

      // 🔒 VERIFICACIÓN DE OWNERSHIP
      // Si el usuario es coach, solo puede ver su propio contrato
      if (profile.rol === 'coach') {
        const { data: coachData } = await supabase
          .from('coaches')
          .select('user_id')
          .eq('id', coachId)
          .single()

        if (!coachData || coachData.user_id !== user.id) {
          console.error('❌ [PDF API] Coach intentando acceder a contrato de otro coach')
          return NextResponse.json(
            { error: 'No tienes permiso para ver este contrato' },
            { status: 403 }
          )
        }
        
        console.log('✅ [PDF API] Ownership verificado para coach')
      }

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

      // Obtener datos del coach
      console.log('📄 [PDF API] Obteniendo datos del coach...')
      
      const { data: coachData, error: coachError } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', coachId)
        .single()

      if (coachError || !coachData) {
        console.error('❌ [PDF API] Error al obtener datos del coach:', coachError)
        return NextResponse.json(
          { error: 'Coach no encontrado' },
          { status: 404 }
        )
      }

      console.log('✅ [PDF API] Datos del coach obtenidos:', coachData.nombre, coachData.apellidos)

      // Obtener contrato activo del coach
      console.log('📄 [PDF API] Obteniendo contrato activo...')
      
      const { data: contratoData, error: contratoError } = await supabase
        .from('coach_contracts')
        .select('*')
        .eq('coach_id', coachId)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (contratoError || !contratoData) {
        console.error('❌ [PDF API] No se encontró contrato activo:', contratoError)
        return NextResponse.json(
          { error: 'No se encontró un contrato activo para este coach' },
          { status: 404 }
        )
      }

      console.log('✅ [PDF API] Contrato activo encontrado:', contratoData.id)
      console.log('📄 [PDF API] Tipo de contrato:', contratoData.tipo_contrato)

      // Importar PDFDocument y generar PDF
      console.log('📄 [PDF API] Generando PDF...')
      
      try {
        const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
        
        const pdfDoc = await PDFDocument.create()
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        
        // Crear página
        const page = pdfDoc.addPage([595.28, 841.89]) // A4
        const { width, height } = page.getSize()
        
        let yPosition = height - 50

        // Título
        page.drawText('CONTRATO DE PRESTACIÓN DE SERVICIOS', {
          x: 50,
          y: yPosition,
          size: 16,
          font: helveticaBold,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 40

        // Información del coach
        page.drawText('DATOS DEL COACH:', {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 25
        
        page.drawText(`Nombre: ${coachData.nombre} ${coachData.apellidos}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 20
        
        page.drawText(`Email: ${coachData.email}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 20
        
        if (coachData.telefono) {
          page.drawText(`Teléfono: ${coachData.telefono}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0)
          })
          
          yPosition -= 20
        }
        
        yPosition -= 20

        // Información del contrato
        page.drawText('DATOS DEL CONTRATO:', {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 25
        
        page.drawText(`Tipo de contrato: ${contratoData.tipo_contrato.toUpperCase()}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 20
        
        page.drawText(`Fecha de inicio: ${contratoData.fecha_inicio}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 20
        
        if (contratoData.fecha_fin) {
          page.drawText(`Fecha de fin: ${contratoData.fecha_fin}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0)
          })
          
          yPosition -= 20
        }
        
        if (contratoData.sueldo_base) {
          page.drawText(`Sueldo base: $${contratoData.sueldo_base.toFixed(2)}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0)
          })
          
          yPosition -= 20
        }
        
        if (contratoData.comision_por_clase) {
          page.drawText(`Comisión por clase: $${contratoData.comision_por_clase.toFixed(2)}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0)
          })
          
          yPosition -= 20
        }
        
        yPosition -= 20

        // Términos y condiciones
        page.drawText('TÉRMINOS Y CONDICIONES:', {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 25

        const terminos = [
          '1. El coach se compromete a impartir clases de acuerdo al horario establecido.',
          '2. El coach deberá mantener un nivel profesional en todo momento.',
          '3. El pago se realizará de acuerdo a lo estipulado en este contrato.',
          '4. Cualquier modificación al contrato deberá ser acordada por ambas partes.',
          '5. El contrato podrá ser terminado con previo aviso de 30 días.'
        ]

        terminos.forEach(termino => {
          if (yPosition < 100) {
            // Crear nueva página si se acaba el espacio
            const newPage = pdfDoc.addPage([595.28, 841.89])
            yPosition = height - 50
          }
          
          page.drawText(termino, {
            x: 50,
            y: yPosition,
            size: 9,
            font: helveticaFont,
            color: rgb(0, 0, 0),
            maxWidth: width - 100
          })
          
          yPosition -= 20
        })
        
        yPosition -= 30

        // Firmas
        page.drawText('_____________________________', {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        page.drawText('_____________________________', {
          x: 320,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 20
        
        page.drawText('Firma del Coach', {
          x: 50,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        page.drawText('Firma del Representante', {
          x: 320,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })

        // Generar PDF bytes
        const pdfBytes = await pdfDoc.save()

        console.log('✅ [PDF API] PDF generado, tamaño:', pdfBytes.length, 'bytes')

        if (!pdfBytes || pdfBytes.length === 0) {
          console.error('❌ [PDF API] PDF generado está vacío')
          return NextResponse.json(
            { error: 'Error: PDF generado está vacío' },
            { status: 500 }
          )
        }

        // Preparar nombre del archivo
        const filename = `contrato-${coachData.nombre}-${coachData.apellidos}.pdf`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remover acentos
          .replace(/[^a-zA-Z0-9.-]/g, '-') // Reemplazar caracteres especiales

        console.log('📦 [PDF API] Nombre archivo:', filename)
        console.log('✅ [PDF API] Retornando PDF al cliente...')
        console.log('📄 [PDF API] ========== FIN EXITOSO ==========')
        
        // Retornar PDF
        return new NextResponse(pdfBytes, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBytes.length.toString(),
            'Cache-Control': 'no-store, max-age=0'
          }
        })

      } catch (pdfError) {
        console.error('❌ [PDF API] Error generando PDF:', pdfError)
        console.error('❌ [PDF API] Stack trace:', pdfError.stack)
        return NextResponse.json(
          { error: 'Error al generar el PDF: ' + pdfError.message },
          { status: 500 }
        )
      }

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
  },
  { allowedRoles: ['admin', 'coach'] }
)