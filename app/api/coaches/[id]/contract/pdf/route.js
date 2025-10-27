const handleDescargarContrato = async () => {
  try {
    setDownloadingPDF(true)
    
    console.log('📄 Generando PDF para coach:', params.id)
    
    // Obtener sesión para el token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No hay sesión activa')
    }
    
    const response = await fetch(`/api/coaches/${params.id}/contract/pdf`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al generar PDF')
    }

    const blob = await response.blob()
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contrato-${coach.nombre}-${coach.apellidos}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    console.log('✅ PDF descargado exitosamente')
  } catch (error) {
    console.error('❌ Error descargando PDF:', error)
    alert('Error al descargar el contrato: ' + error.message)
  } finally {
    setDownloadingPDF(false)
  }
}