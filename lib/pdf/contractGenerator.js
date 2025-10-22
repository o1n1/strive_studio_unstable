import jsPDF from 'jspdf'

export async function generateCoachContractPDF({
  coach,
  contrato,
  firmaDigital
}) {
  const doc = new jsPDF()
  
  // Colores de marca
  const primaryColor = [174, 63, 33] // #AE3F21
  const textColor = [53, 53, 53] // #353535
  
  let yPos = 20

  // Logo/Header
  doc.setFontSize(24)
  doc.setTextColor(...primaryColor)
  doc.text('STRIVE STUDIO', 105, yPos, { align: 'center' })
  
  yPos += 10
  doc.setFontSize(16)
  doc.text('CONTRATO DE SERVICIOS PROFESIONALES', 105, yPos, { align: 'center' })
  
  yPos += 15
  doc.setDrawColor(...primaryColor)
  doc.line(20, yPos, 190, yPos)
  
  yPos += 10

  // Información del contrato
  doc.setFontSize(10)
  doc.setTextColor(...textColor)
  doc.text(`Contrato No: ${contrato.id.substring(0, 8).toUpperCase()}`, 20, yPos)
  doc.text(`Fecha: ${new Date(contrato.fecha_inicio).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, 140, yPos)
  
  yPos += 10

  // Partes del contrato
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('CONTRATANTE:', 20, yPos)
  yPos += 6
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  doc.text('Strive Studio', 20, yPos)
  yPos += 5
  doc.text('RFC: [PENDIENTE]', 20, yPos)
  
  yPos += 10
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('PRESTADOR DE SERVICIOS (COACH):', 20, yPos)
  yPos += 6
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  doc.text(`${coach.nombre} ${coach.apellidos}`, 20, yPos)
  yPos += 5
  doc.text(`RFC: ${coach.rfc || 'N/A'}`, 20, yPos)
  yPos += 5
  doc.text(`Email: ${coach.email}`, 20, yPos)
  yPos += 5
  doc.text(`Teléfono: ${coach.telefono}`, 20, yPos)

  yPos += 12

  // Cláusulas
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('DECLARACIONES', 20, yPos)
  yPos += 8

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  
  const declaraciones = [
    'I. El CONTRATANTE es una empresa dedicada a la impartición de clases de ciclismo indoor y entrenamiento funcional.',
    'II. El PRESTADOR DE SERVICIOS cuenta con la experiencia, conocimientos y certificaciones necesarias para impartir clases de fitness.',
    'III. Ambas partes manifiestan su voluntad de celebrar el presente contrato bajo las siguientes:'
  ]

  declaraciones.forEach(text => {
    const lines = doc.splitTextToSize(text, 170)
    lines.forEach(line => {
      doc.text(line, 20, yPos)
      yPos += 5
    })
    yPos += 3
  })

  yPos += 5
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('CLÁUSULAS', 20, yPos)
  yPos += 8

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')

  const clausulas = [
    {
      titulo: 'PRIMERA. OBJETO DEL CONTRATO',
      texto: 'El PRESTADOR DE SERVICIOS se obliga a impartir clases de ciclismo indoor y/o entrenamiento funcional en las instalaciones del CONTRATANTE, así como a realizar las actividades inherentes a dicha función.'
    },
    {
      titulo: 'SEGUNDA. TIPO DE CONTRATO Y COMPENSACIÓN',
      texto: `Tipo: ${contrato.tipo_contrato.replace('_', ' ').toUpperCase()}. El PRESTADOR DE SERVICIOS recibirá una compensación económica según lo acordado y establecido en comunicación directa con el CONTRATANTE.`
    },
    {
      titulo: 'TERCERA. VIGENCIA',
      texto: `El presente contrato inicia el ${new Date(contrato.fecha_inicio).toLocaleDateString('es-MX')} y tendrá vigencia indefinida hasta que alguna de las partes decida darlo por terminado mediante aviso con 15 días de anticipación.`
    },
    {
      titulo: 'CUARTA. OBLIGACIONES DEL PRESTADOR DE SERVICIOS',
      texto: 'a) Impartir las clases asignadas con puntualidad, profesionalismo y calidad. b) Mantener vigentes las certificaciones requeridas. c) Cumplir con los protocolos de seguridad e higiene. d) Respetar los valores y cultura organizacional de Strive Studio.'
    },
    {
      titulo: 'QUINTA. OBLIGACIONES DEL CONTRATANTE',
      texto: 'a) Proporcionar las instalaciones y equipo necesario. b) Realizar el pago de la compensación acordada en tiempo y forma. c) Proporcionar capacitación continua cuando sea necesario.'
    },
    {
      titulo: 'SEXTA. PROPIEDAD INTELECTUAL',
      texto: 'Las rutinas, música y materiales proporcionados por el CONTRATANTE son de su propiedad y no podrán ser utilizados fuera del contexto de Strive Studio sin autorización expresa.'
    },
    {
      titulo: 'SÉPTIMA. CONFIDENCIALIDAD',
      texto: 'El PRESTADOR DE SERVICIOS se compromete a mantener confidencialidad sobre la información de clientes, operaciones y cualquier información privilegiada del CONTRATANTE.'
    },
    {
      titulo: 'OCTAVA. TERMINACIÓN',
      texto: 'Cualquiera de las partes podrá dar por terminado el presente contrato mediante aviso por escrito con 15 días de anticipación. El incumplimiento de las obligaciones dará derecho a la terminación inmediata.'
    }
  ]

  clausulas.forEach((clausula, index) => {
    // Verificar si necesitamos nueva página
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFont(undefined, 'bold')
    doc.text(clausula.titulo, 20, yPos)
    yPos += 5
    doc.setFont(undefined, 'normal')
    
    const lines = doc.splitTextToSize(clausula.texto, 170)
    lines.forEach(line => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      doc.text(line, 20, yPos)
      yPos += 4
    })
    yPos += 6
  })

  // Nueva página para firmas
  doc.addPage()
  yPos = 40

  doc.setFontSize(10)
  doc.text('Las partes manifiestan su conformidad firmando el presente contrato:', 20, yPos)
  yPos += 30

  // Firma digital del coach
  if (firmaDigital) {
    try {
      doc.addImage(firmaDigital, 'PNG', 20, yPos, 60, 20)
    } catch (e) {
      console.error('Error agregando firma:', e)
    }
  }
  
  yPos += 25
  doc.line(20, yPos, 90, yPos)
  yPos += 5
  doc.setFontSize(9)
  doc.text(`${coach.nombre} ${coach.apellidos}`, 20, yPos)
  yPos += 4
  doc.text('PRESTADOR DE SERVICIOS', 20, yPos)
  yPos += 4
  doc.text(`Fecha: ${new Date(contrato.fecha_firma).toLocaleDateString('es-MX')}`, 20, yPos)

  // Firma del contratante
  yPos -= 33
  doc.setFontSize(10)
  doc.line(120, yPos + 25, 190, yPos + 25)
  yPos += 30
  doc.setFontSize(9)
  doc.text('Strive Studio', 120, yPos)
  yPos += 4
  doc.text('CONTRATANTE', 120, yPos)

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text('Este documento ha sido generado electrónicamente y contiene firma digital válida.', 105, 280, { align: 'center' })
  doc.text(`ID del contrato: ${contrato.id}`, 105, 285, { align: 'center' })

  return doc.output('blob')
}
