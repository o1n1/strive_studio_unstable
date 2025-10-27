import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/**
 * Genera PDF del contrato del coach con contenido de template y firma embebida
 * @param {Object} params
 * @param {Object} params.coach - Datos del coach
 * @param {Object} params.contrato - Datos del contrato
 * @param {string} params.contenidoTemplate - Contenido del template personalizado
 * @param {string} params.firmaEmbebida - Firma digital en base64 PNG
 */
export async function generateCoachContractPDF({ 
  coach, 
  contrato, 
  contenidoTemplate,
  firmaEmbebida 
}) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Carta
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  const { width, height } = page.getSize()
  const margin = 50
  const maxWidth = width - (margin * 2)
  let yPosition = height - margin

  // Helper para agregar texto con wrap
  const addText = (text, size, font, lineHeight = size * 1.5) => {
    const words = text.split(' ')
    let line = ''
    
    words.forEach((word, index) => {
      const testLine = line + word + ' '
      const testWidth = font.widthOfTextAtSize(testLine, size)
      
      if (testWidth > maxWidth && line.length > 0) {
        page.drawText(line.trim(), {
          x: margin,
          y: yPosition,
          size,
          font,
          color: rgb(0.15, 0.15, 0.15)
        })
        yPosition -= lineHeight
        line = word + ' '
      } else {
        line = testLine
      }
    })
    
    if (line.trim().length > 0) {
      page.drawText(line.trim(), {
        x: margin,
        y: yPosition,
        size,
        font,
        color: rgb(0.15, 0.15, 0.15)
      })
      yPosition -= lineHeight
    }
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
  addText('CONTRATO DE PRESTACIÓN DE SERVICIOS', 18, fontBold, 25)
  addText('STRIVE STUDIO', 14, fontBold, 20)
  yPosition -= 10
  addLine()

  // Datos del contrato
  addText('INFORMACIÓN DEL CONTRATO', 12, fontBold, 20)
  addText(`Tipo: ${contrato.tipo_contrato || 'Por Clase'}`, 10, fontRegular, 15)
  addText(`Fecha de Inicio: ${new Date(contrato.fecha_inicio).toLocaleDateString('es-MX')}`, 10, fontRegular, 15)
  addText(`Fecha de Firma: ${new Date(contrato.fecha_firma).toLocaleDateString('es-MX')}`, 10, fontRegular, 15)
  yPosition -= 10
  addLine()

  // Datos del coach
  addText('DATOS DEL COACH', 12, fontBold, 20)
  addText(`Nombre: ${coach.nombre} ${coach.apellidos}`, 10, fontRegular, 15)
  addText(`Email: ${coach.email}`, 10, fontRegular, 15)
  addText(`Teléfono: ${coach.telefono || 'N/A'}`, 10, fontRegular, 15)
  if (coach.rfc) addText(`RFC: ${coach.rfc}`, 10, fontRegular, 15)
  yPosition -= 10
  addLine()

  // Contenido del template personalizado
  addText('TÉRMINOS Y CONDICIONES', 12, fontBold, 20)
  yPosition -= 5
  
  // Procesar el contenido del template línea por línea
  const lineas = contenidoTemplate.split('\n')
  lineas.forEach(linea => {
    if (yPosition < 100) {
      // Crear nueva página si es necesario
      const newPage = pdfDoc.addPage([612, 792])
      yPosition = height - margin
    }
    
    if (linea.trim().length > 0) {
      addText(linea.trim(), 9, fontRegular, 14)
    } else {
      yPosition -= 10 // Espacio para líneas vacías
    }
  })

  yPosition -= 20

  // Firma digital embebida
  if (firmaEmbebida) {
    if (yPosition < 150) {
      // Nueva página si no hay espacio
      const newPage = pdfDoc.addPage([612, 792])
      yPosition = height - margin
    }

    addText('FIRMA DIGITAL DEL COACH:', 10, fontBold, 20)
    
    try {
      // Convertir base64 a bytes
      const firmaBase64 = firmaEmbebida.includes(',') 
        ? firmaEmbebida.split(',')[1] 
        : firmaEmbebida
      
      const firmaBytes = Uint8Array.from(atob(firmaBase64), c => c.charCodeAt(0))
      const firmaImage = await pdfDoc.embedPng(firmaBytes)
      const firmaDims = firmaImage.scale(0.25)
      
      page.drawImage(firmaImage, {
        x: margin,
        y: yPosition - firmaDims.height,
        width: firmaDims.width,
        height: firmaDims.height,
      })
      
      yPosition -= firmaDims.height + 15
      
      addText(`Firmado digitalmente el: ${new Date().toLocaleDateString('es-MX')}`, 8, fontRegular, 12)
    } catch (error) {
      console.error('Error embebiendo firma:', error)
      addText('[Firma digital no disponible]', 9, fontRegular, 15)
    }
  } else {
    addText('[Sin firma digital]', 9, fontRegular, 15)
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}