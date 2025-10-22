'use client'

import { CheckCircle, Clock, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function OnboardingExitoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
      
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className="p-8 md:p-12 rounded-2xl text-center"
          style={{ background: 'rgba(42, 42, 42, 0.8)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
          
          {/* Icono de éxito */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-bounce"
            style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle size={48} style={{ color: '#10b981' }} />
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            ¡Solicitud Enviada con Éxito!
          </h1>

          <p className="text-lg mb-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Tu registro ha sido completado correctamente
          </p>

          {/* Información */}
          <div className="space-y-6 mb-8">
            {/* Paso 1 */}
            <div className="p-6 rounded-xl text-left"
              style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(174, 63, 33, 0.3)' }}>
                  <Clock size={24} style={{ color: '#AE3F21' }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                    Revisión en Proceso
                  </h3>
                  <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    El equipo administrativo revisará tu solicitud y documentos en las próximas 24-48 horas.
                  </p>
                </div>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="p-6 rounded-xl text-left"
              style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.3)' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(156, 122, 94, 0.3)' }}>
                  <Mail size={24} style={{ color: '#B39A72' }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Te Notificaremos por Email
                  </h3>
                  <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Recibirás un correo electrónico cuando tu solicitud sea aprobada o si necesitamos información adicional.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="p-6 rounded-xl mb-8"
            style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h3 className="font-bold mb-3 text-left" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Mientras tanto:
            </h3>
            <ul className="space-y-2 text-left">
              <li className="flex items-start gap-2 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span>Revisa tu bandeja de entrada (y spam) para futuros emails</span>
              </li>
              <li className="flex items-start gap-2 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span>Asegúrate de tener tus certificaciones vigentes y disponibles</span>
              </li>
              <li className="flex items-start gap-2 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span>Prepárate para comenzar a impartir clases increíbles</span>
              </li>
            </ul>
          </div>

          {/* Botón */}
          <Link href="/">
            <button
              className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Ir al Inicio
              <ArrowRight size={20} />
            </button>
          </Link>

          {/* Footer */}
          <p className="text-xs mt-6" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
            ¿Tienes preguntas? Contacta a nuestro equipo administrativo
          </p>
        </div>
      </div>
    </div>
  )
}