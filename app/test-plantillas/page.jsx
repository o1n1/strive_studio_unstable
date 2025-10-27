'use client'

import { useEffect, useState } from 'react'

export default function TestPlantillasPage() {
  const [loading, setLoading] = useState(true)
  const [plantillas, setPlantillas] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    testConexion()
  }, [])

  const testConexion = async () => {
    try {
      console.log('🔍 Iniciando test de plantillas...')
      
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      console.log('📡 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

      // Consulta 1: Todas las plantillas
      console.log('\n--- CONSULTA 1: Todas las plantillas ---')
      const { data: todas, error: error1 } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error1) {
        console.error('❌ Error consultando todas:', error1)
      } else {
        console.log('✅ Total de plantillas:', todas?.length || 0)
        todas?.forEach((p, i) => {
          console.log(`\nPlantilla ${i + 1}:`)
          console.log('  - ID:', p.id)
          console.log('  - Nombre:', p.nombre)
          console.log('  - Tipo:', p.tipo_contrato)
          console.log('  - Vigente:', p.vigente)
          console.log('  - Es Default:', p.es_default)
          console.log('  - Contenido (primeros 100 chars):', p.contenido?.substring(0, 100))
        })
      }

      // Consulta 2: Plantilla activa para coaches
      console.log('\n--- CONSULTA 2: Plantilla activa (por_clase + vigente + es_default) ---')
      const { data: activa, error: error2 } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('tipo_contrato', 'por_clase')
        .eq('vigente', true)
        .eq('es_default', true)
        .single()

      if (error2) {
        console.error('❌ Error consultando activa:', error2)
        setError('No se encontró plantilla activa: ' + error2.message)
      } else if (!activa) {
        console.error('❌ No hay plantilla activa')
        setError('No existe ninguna plantilla activa')
      } else {
        console.log('✅ Plantilla activa encontrada:')
        console.log('  - ID:', activa.id)
        console.log('  - Nombre:', activa.nombre)
        console.log('  - Contenido completo:', activa.contenido)
        setPlantillas([activa])
      }

      setLoading(false)

    } catch (err) {
      console.error('❌ Error general:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A1A' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#AE3F21' }}></div>
          <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Verificando plantillas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8" style={{ background: '#1A1A1A' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          🔍 Test de Plantillas
        </h1>

        <div className="p-6 rounded-xl mb-6" style={{ background: '#2A2A2A', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
            Instrucciones
          </h2>
          <p className="text-sm mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            1. Abre la consola del navegador (F12 → Console)
          </p>
          <p className="text-sm mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            2. Revisa los logs que muestran todas las plantillas
          </p>
          <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            3. Verifica que existe UNA plantilla con vigente=true y es_default=true
          </p>
        </div>

        {error && (
          <div className="p-6 rounded-xl mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
              ❌ Error
            </h2>
            <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              {error}
            </p>
            <p className="text-sm mt-4" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Ejecuta el script SQL de corrección en Supabase
            </p>
          </div>
        )}

        {plantillas.length > 0 && (
          <div className="p-6 rounded-xl" style={{ background: '#2A2A2A', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
              ✅ Plantilla Activa Encontrada
            </h2>
            {plantillas.map((p) => (
              <div key={p.id} className="mb-4">
                <p className="text-sm mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  <strong>ID:</strong> {p.id}
                </p>
                <p className="text-sm mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  <strong>Nombre:</strong> {p.nombre}
                </p>
                <p className="text-sm mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  <strong>Tipo:</strong> {p.tipo_contrato}
                </p>
                <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(179, 154, 114, 0.1)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    CONTENIDO:
                  </p>
                  <pre className="text-xs whitespace-pre-wrap" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {p.contenido}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg font-semibold"
            style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
          >
            🔄 Recargar Test
          </button>
        </div>
      </div>
    </div>
  )
}