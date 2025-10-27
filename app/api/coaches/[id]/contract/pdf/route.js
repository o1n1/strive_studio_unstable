import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'

export const GET = withAuth(
  async (request, context) => {
    try {
      const { user, profile, supabase } = context
      const { params } = context
      
      const { id: coachId } = params || {}
      
      if (!coachId) {
        return NextResponse.json(
          { error: 'ID de coach no proporcionado' },
          { status: 400 }
        )
      }

      // Validar UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(coachId)) {
        return NextResponse.json(
          { error: 'ID de coach inválido' },
          { status: 400 }
        )
      }

      // Verificar ownership si es coach
      if (profile.rol === 'coach') {
        const { data: coachData } = await supabase
          .from('coaches')
          .select('user_id')
          .eq('id', coachId)
          .single()

        if (!coachData || coachData.user_id !== user.id) {
          return NextResponse.json(
            { error: 'No tienes permiso para ver este contrato' },
            { status: 403 }
          )
        }
      }

      // Obtener datos del coach
      const { data: coachData, error: coachError } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', coachId)
        .single()

      if (coachError || !coachData) {
        return NextResponse.json(
          { error: 'Coach no encontrado' },
          { status: 404 }
        )
      }

      // Obtener contrato - CORREGIDO: usar vigente=true y estado='activo'
      const { data: contratoData, error: contratoError } = await supabase
        .from('coach_contracts')
        .select('*')
        .eq('coach_id', coachId)
        .eq('vigente', true)
        .eq('estado', 'activo')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (contratoError || !contratoData) {
        console.error('❌ No se encontró contrato:', contratoError)
        return NextResponse.json(
          { error: 'No se encontró un contrato activo para este coach' },
          { status: 404 }
        )
      }

      // Generar PDF
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
      
      const pdfDoc = await PDFDocument.create()
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      
      const page = pdfDoc.addPage([595.28, 841.89])
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
      
      if (coachData.rfc) {
        page.drawText(`RFC: ${coachData.rfc}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 30
      }

      // Información del contrato
      page.drawText('DATOS DEL CONTRATO:', {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      })
      
      yPosition -= 25
      
      page.drawText(`Tipo: ${contratoData.tipo_contrato}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      })
      
      yPosition -= 20
      
      page.drawText(`Fecha de inicio: ${new Date(contratoData.fecha_inicio).toLocaleDateString('es-MX')}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      })
      
      yPosition -= 20
      
      if (contratoData.fecha_fin) {
        page.drawText(`Fecha de fin: ${new Date(contratoData.fecha_fin).toLocaleDateString('es-MX')}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 30
      } else {
        page.drawText('Vigencia: Indefinida', {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        
        yPosition -= 30
      }

      // Términos
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

      // Generar PDF
      const pdfBytes = await pdfDoc.save()

      if (!pdfBytes || pdfBytes.length === 0) {
        return NextResponse.json(
          { error: 'Error: PDF generado está vacío' },
          { status: 500 }
        )
      }

      const filename = `contrato-${coachData.nombre}-${coachData.apellidos}.pdf`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '-')
      
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBytes.length.toString(),
        },
      })

    } catch (error) {
      console.error('❌ Error en PDF API:', error)
      return NextResponse.json(
        { error: 'Error generando PDF: ' + error.message },
        { status: 500 }
      )
    }
  },
  ['admin', 'coach']
)