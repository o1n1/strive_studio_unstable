import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/**
 * Genera PDF del contrato del coach con firma digital
 */
export async function generateCoachContractPDF({ coach, contrato, firmaDigital }) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Carta
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  const { width, height } = page.getSize()
  const margin = 50
  let yPosition = height - margin

  const addText = (text, size, font, x = margin, lineHeight = size * 1.5) => {
    page.drawText(text, {
      x,
      y: yPosition,
      size,
      font,
      color: rgb(0.15, 0.15, 0.15)
    })
    yPosition -= lineHeight
  }

  const addLine = () => {
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7)
    })
    yPosition -= 20
  }

  // Header
  addText('CONTRATO DE PRESTACIÓN DE SERVICIOS', 18, fontBold, margin, 25)
  addText('STRIVE STUDIO', 14, fontBold, margin, 20)
  yPosition -= 10
  addLine()

  // Datos del contrato
  addText('INFORMACIÓN DEL CONTRATO', 12, fontBold, margin, 20)
  addText(`Tipo: ${contrato.tipo_contrato || 'Por Clase'}`, 10, fontRegular)
  addText(`Fecha de Inicio: ${new Date(contrato.fecha_inicio).toLocaleDateString('es-MX')}`, 10, fontRegular)
  addText(`Fecha de Firma: ${new Date(contrato.fecha_firma).toLocaleDateString('es-MX')}`, 10, fontRegular)
  yPosition -= 10
  addLine()

  // Datos del coach
  addText('DATOS DEL COACH', 12, fontBold, margin, 20)
  addText(`Nombre: ${coach.nombre} ${coach.apellidos}`, 10, fontRegular)
  addText(`Email: ${coach.email}`, 10, fontRegular)
  addText(`Teléfono: ${coach.telefono || 'N/A'}`, 10, fontRegular)
  if (coach.rfc) addText(`RFC: ${coach.rfc}`, 10, fontRegular)
  yPosition -= 10
  addLine()

  // Términos
  addText('TÉRMINOS Y CONDICIONES', 12, fontBold, margin, 20)
  const terminos = [
    '1. El COACH se compromete a impartir clases con profesionalismo.',
    '2. Deberá cumplir con los estándares de calidad de STRIVE STUDIO.',
    '3. Es responsable de mantener certificaciones vigentes.',
    '4. La compensación será según lo acordado en este contrato.',
    '5. Cualquier modificación requiere aprobación de ambas partes.'
  ]
  
  terminos.forEach(termino => {
    addText(termino, 9, fontRegular, margin, 15)
  })

  yPosition -= 20

  // Firma digital
  if (firmaDigital) {
    addText('FIRMA DIGITAL DEL COACH:', 10, fontBold, margin, 20)
    try {
      const firmaBytes = Uint8Array.from(atob(firmaDigital.split(',')[1]), c => c.charCodeAt(0))
      const firmaImage = await pdfDoc.embedPng(firmaBytes)
      const firmaDims = firmaImage.scale(0.3)
      
      page.drawImage(firmaImage, {
        x: margin,
        y: yPosition - firmaDims.height,
        width: firmaDims.width,
        height: firmaDims.height,
      })
      yPosition -= firmaDims.height + 10
    } catch (error) {
      console.error('Error embebiendo firma:', error)
      addText('[Firma digital no disponible]', 9, fontRegular)
    }
  }

  addText(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 9, fontRegular)

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}