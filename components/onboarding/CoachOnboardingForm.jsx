'use client'

import { useState } from 'react'
import StepIndicator from './StepIndicator'
import Step1CrearCuenta from './steps/Step1CrearCuenta'
import Step2InfoPersonal from './steps/Step2InfoPersonal'
import Step3InfoProfesional from './steps/Step3InfoProfesional'
import Step4Certificaciones from './steps/Step4Certificaciones'
import Step5RedesSociales from './steps/Step5RedesSociales'

const TOTAL_STEPS = 9

export default function CoachOnboardingForm({ invitacion, token }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Paso 1: Cuenta
    email: invitacion.email,
    password: '',
    confirmPassword: '',
    
    // Paso 2: Info Personal
    nombre: '',
    apellidos: '',
    telefono: '',
    fecha_nacimiento: '',
    direccion: '',
    rfc: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    foto_perfil: null,
    
    // Paso 3: Info Profesional (siguiente sesión)
    bio: '',
    años_experiencia: '',
    especialidades: [],
    
    // Paso 4: Certificaciones
    certificaciones: [],
    
    // Paso 5: Redes Sociales
    instagram: '',
    facebook: '',
    tiktok: '',
    
    // Paso 6: Documentos
    ine_frente: null,
    ine_reverso: null,
    comprobante_domicilio: null,
    titulo_cedula: null,
    antecedentes_penales: null,
    
    // Paso 7: Info Bancaria
    banco: '',
    clabe: '',
    titular_cuenta: '',
    estado_cuenta: null,
    
    // Paso 8: Disponibilidad
    disponibilidad: {},
    
    // Paso 9: Contrato
    aceptar_terminos: false,
    firma_digital: ''
  })

  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }))
  }

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CrearCuenta
            data={formData}
            updateData={updateFormData}
            nextStep={nextStep}
          />
        )
      case 2:
        return (
          <Step2InfoPersonal
            data={formData}
            updateData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )
      // Casos 3-9 se agregarán en siguientes sesiones
      default:
        return (
          <div className="text-center p-8">
            <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Paso {currentStep} - En construcción
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90"
                style={{ background: '#B39A72', color: '#1a1a1a', fontFamily: 'Montserrat, sans-serif' }}>
                ← Anterior
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90"
                style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Siguiente →
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Registro de Coach
        </h1>
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Categoría: <strong style={{ color: '#AE3F21' }}>{invitacion.categoria}</strong>
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Step Content */}
      <div className="mt-8 p-8 rounded-2xl"
        style={{ background: 'rgba(42, 42, 42, 0.8)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
        {renderStep()}
      </div>
    </div>
  )
}
