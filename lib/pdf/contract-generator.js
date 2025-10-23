import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/**
 * Genera un PDF del contrato del coach con firma digital VISIBLE
 * @param {Object} coach - Datos completos del coach
 * @param {Object} contract - Datos del contrato
 * @returns {Uint8Array} - PDF en bytes
 */
export async function generateCoachContractPDF(coach, contract) {
  // Crear nuevo documento PDF
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Tamaño carta
  
  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  const { width, height } = page.getSize()
  const margin = 50
  let yPosition = height - margin

  // Función helper para agregar texto
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

  // Función para agregar línea separadora
  const addLine = () => {
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7)
    })
    yPosition -= 20
  }

  // ===== HEADER =====
  addText('CONTRATO DE PRESTACIÓN DE SERVICIOS', 18, fontBold, margin, 25)
  addText('STRIVE STUDIO', 14, fontBold, margin, 20)
  yPosition -= 10
  addLine()

  // ===== DATOS DEL CONTRATO =====
  addText('INFORMACIÓN DEL CONTRATO', 12, fontBold, margin, 20)
  addText(`Tipo de Contrato: ${contract.tipo_contrato || 'Por Clase'}`, 10, fontRegular)
  addText(`Fecha de Inicio: ${new Date(contract.fecha_inicio).toLocaleDateString('es-MX')}`, 10, fontRegular)
  
  if (contract.fecha_fin) {
    addText(`Fecha de Fin: ${new Date(contract.fecha_fin).toLocaleDateString('es-MX')}`, 10, fontRegular)
  } else {
    addText('Vigencia: Indefinida', 10, fontRegular)
  }
  
  addText(`Estado: ${contract.estado?.toUpperCase() || 'ACTIVO'}`, 10, fontRegular)
  yPosition -= 10
  addLine()

  // ===== DATOS DEL COACH =====
  addText('DATOS DEL COACH', 12, fontBold, margin, 20)
  addText(`Nombre Completo: ${coach.nombre} ${coach.apellidos}`, 10, fontRegular)
  addText(`Email: ${coach.email}`, 10, fontRegular)
  addText(`Teléfono: ${coach.telefono || 'No especificado'}`, 10, fontRegular)
  
  if (coach.rfc) {
    addText(`RFC: ${coach.rfc}`, 10, fontRegular)
  }
  
  yPosition -= 10
  addLine()

  // ===== TÉRMINOS Y CONDICIONES =====
  addText('TÉRMINOS Y CONDICIONES', 12, fontBold, margin, 20)
  
  const terminos = [
    '1. El COACH se compromete a impartir clases con profesionalismo y puntualidad.',
    '2. El COACH deberá cumplir con los estándares de calidad establecidos por STRIVE STUDIO.',
    '3. El COACH es responsable de mantener vigentes sus certificaciones profesionales.',
    '4. La compensación será pagada según lo acordado en este contrato.',
    '5. Cualquier modificación a este contrato deberá ser acordada por escrito.',
    '6. Este contrato puede ser rescindido por cualquiera de las partes con previo aviso.'
  ]

  terminos.forEach(termino => {
    if (yPosition < margin + 120) {
      // Nueva página si no hay espacio
      const newPage = pdfDoc.addPage([612, 792])
      yPosition = height - margin
    }
    addText(termino, 9, fontRegular, margin, 15)
  })

  yPosition -= 20

  // ===== FIRMA DIGITAL =====
  if (contract.firmado && contract.fecha_firma) {
    addLine()
    addText('FIRMA DIGITAL', 12, fontBold, margin, 20)
    addText(`Firmado electrónicamente el: ${new Date(contract.fecha_firma).toLocaleString('es-MX')}`, 9, fontRegular)
    
    if (contract.ip_firma) {
      addText(`IP: ${contract.ip_firma}`, 8, fontRegular, margin, 12)
    }

    // ✅ INSERTAR IMAGEN REAL DE LA FIRMA
    if (contract.firma_digital) {
      try {
        console.log('🖊️ Insertando firma digital en PDF...')
        
        // La firma viene en formato: data:image/png;base64,iVBORw0KGgoAAAA...
        // Necesitamos extraer solo el base64
        let firmaBase64 = contract.firma_digital
        
        // Remover el prefijo "data:image/png;base64," si existe
        if (firmaBase64.includes('base64,')) {
          firmaBase64 = firmaBase64.split('base64,')[1]
        }
        
        // Decodificar base64 a bytes
        const firmaBytes = Uint8Array.from(atob(firmaBase64), c => c.charCodeAt(0))
        
        // Embeber imagen PNG en el PDF
        const firmaImage = await pdfDoc.embedPng(firmaBytes)
        
        // Obtener dimensiones de la imagen y escalar
        const firmaDims = firmaImage.scale(0.3) // Escalar al 30% del tamaño original
        
        yPosition -= 10
        
        // Dibujar la imagen de la firma en el PDF
        page.drawImage(firmaImage, {
          x: margin,
          y: yPosition - firmaDims.height,
          width: firmaDims.width,
          height: firmaDims.height,
        })
        
        yPosition -= (firmaDims.height + 10)
        
        console.log('✅ Firma digital insertada exitosamente en PDF')
      } catch (error) {
        console.error('⚠️ Error insertando firma en PDF:', error)
        // Fallback: dibujar rectángulo si falla la inserción de imagen
        page.drawRectangle({
          x: margin,
          y: yPosition - 50,
          width: 200,
          height: 50,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1
        })
        
        addText('Firma Digital (Error al cargar imagen)', 8, fontRegular, margin + 10, 15)
        yPosition -= 50
      }
    }

    addText(`${coach.nombre} ${coach.apellidos}`, 10, fontBold, margin, 15)
    addText('Coach de Strive Studio', 9, fontRegular, margin, 15)
  } else {
    addText('PENDIENTE DE FIRMA', 12, fontBold, margin, 20)
  }

  // ===== FOOTER =====
  yPosition = margin
  page.drawText(
    `Generado: ${new Date().toLocaleDateString('es-MX')} | Strive Studio © ${new Date().getFullYear()}`,
    {
      x: margin,
      y: yPosition - 20,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5)
    }
  )

  // Verificación de autenticidad
  if (contract.hash_documento) {
    page.drawText(
      `Hash de verificación: ${contract.hash_documento.substring(0, 40)}...`,
      {
        x: margin,
        y: yPosition - 35,
        size: 7,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5)
      }
    )
  }

  // Guardar y retornar PDF
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
