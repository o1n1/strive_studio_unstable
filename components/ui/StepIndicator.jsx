'use client'
import { Check } from 'lucide-react'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8 px-4 sm:px-8">
      {steps.map((s, idx) => (
        <div key={s.number} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: currentStep >= s.number 
                  ? 'linear-gradient(135deg, #AE3F21 0%, #8d3319 100%)' 
                  : 'rgba(0, 0, 0, 0.3)',
                border: `2px solid ${currentStep >= s.number ? '#AE3F21' : 'rgba(156, 122, 94, 0.3)'}`,
                color: '#FFFCF3'
              }}
            >
              {currentStep > s.number ? <Check size={20} /> : <s.icon size={20} />}
            </div>
            <span 
              className="text-xs opacity-70 hidden sm:block text-center" 
              style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
            >
              {s.title}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div 
              className="h-0.5 flex-1 mx-2 transition-all duration-300" 
              style={{ 
                background: currentStep > s.number ? '#AE3F21' : 'rgba(156, 122, 94, 0.3)' 
              }} 
            />
          )}
        </div>
      ))}
    </div>
  )
}