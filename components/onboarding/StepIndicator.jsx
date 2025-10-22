'use client'

import { Check } from 'lucide-react'

const STEP_NAMES = [
  'Crear Cuenta',
  'Info Personal',
  'Info Profesional',
  'Certificaciones',
  'Redes Sociales',
  'Documentos',
  'Info Bancaria',
  'Firma de Contrato'
]

export default function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="w-full">
      {/* Barra de progreso */}
      <div className="relative mb-8">
        <div className="overflow-hidden h-2 text-xs flex rounded-full"
          style={{ background: 'rgba(156, 122, 94, 0.2)' }}>
          <div
            style={{
              width: `${(currentStep / totalSteps) * 100}%`,
              background: '#AE3F21',
              transition: 'width 0.3s ease'
            }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
          />
        </div>
        <p className="text-center mt-2 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Paso {currentStep} de {totalSteps}
        </p>
      </div>

      {/* Steps con scroll horizontal en móvil */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-2 min-w-max md:min-w-0 md:grid md:grid-cols-9">
          {STEP_NAMES.map((stepName, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            const isPending = stepNumber > currentStep

            return (
              <div key={stepNumber} className="flex-shrink-0 w-24 md:w-auto">
                <div className="flex flex-col items-center">
                  {/* Círculo del paso */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      font-bold text-sm transition-all duration-300
                      ${isCurrent ? 'ring-2 ring-offset-2' : ''}
                    `}
                    style={{
                      background: isCompleted 
                        ? '#10b981' 
                        : isCurrent 
                          ? '#AE3F21' 
                          : 'rgba(156, 122, 94, 0.3)',
                      color: isCompleted || isCurrent ? '#FFFCF3' : '#666',
                      ringColor: isCurrent ? '#AE3F21' : 'transparent',
                      ringOffsetColor: '#1a1a1a'
                    }}>
                    {isCompleted ? (
                      <Check size={20} strokeWidth={3} />
                    ) : (
                      stepNumber
                    )}
                  </div>

                  {/* Nombre del paso */}
                  <p
                    className="text-xs mt-2 text-center leading-tight"
                    style={{
                      color: isCurrent ? '#FFFCF3' : isCompleted ? '#B39A72' : '#666',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: isCurrent ? 'bold' : 'normal'
                    }}>
                    {stepName}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}