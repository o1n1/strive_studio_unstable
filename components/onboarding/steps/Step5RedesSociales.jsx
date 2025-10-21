'use client'

import { useState } from 'react'
import { Instagram, Facebook, Music, AlertCircle, CheckCircle } from 'lucide-react'

export default function Step5RedesSociales({ data, updateData, nextStep, prevStep }) {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    // Validar formato de Instagram (opcional)
    if (data.instagram?.trim()) {
      const instagramRegex = /^[a-zA-Z0-9._]+$/
      if (!instagramRegex.test(data.instagram.replace('@', ''))) {
        newErrors.instagram = 'Formato inválido. Solo letras, números, puntos y guiones bajos'
      }
    }

    // Validar formato de Facebook (opcional)
    if (data.facebook?.trim()) {
      const facebookRegex = /^[a-zA-Z0-9.]+$/
      if (!facebookRegex.test(data.facebook)) {
        newErrors.facebook = 'Formato inválido. Solo letras, números y puntos'
      }
    }

    // Validar formato de TikTok (opcional)
    if (data.tiktok?.trim()) {
      const tiktokRegex = /^[a-zA-Z0-9._]+$/
      if (!tiktokRegex.test(data.tiktok.replace('@', ''))) {
        newErrors.tiktok = 'Formato inválido. Solo letras, números, puntos y guiones bajos'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Limpiar @ si lo agregaron
      const cleanData = {
        instagram: data.instagram?.trim().replace(/^@/, '') || '',
        facebook: data.facebook?.trim() || '',
        tiktok: data.tiktok?.trim().replace(/^@/, '') || ''
      }
      
      updateData(cleanData)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      nextStep()
    } catch (error) {
      console.error('Error:', error)
      setErrors({ submit: 'Error al guardar datos. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    updateData({ instagram: '', facebook: '', tiktok: '' })
    nextStep()
  }

  const hasAnyValue = data.instagram?.trim() || data.facebook?.trim() || data.tiktok?.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Redes Sociales
        </h2>
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Conecta tus redes sociales (opcional)
        </p>
        <p className="text-sm mt-2" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
          Esto nos ayuda a promocionarte mejor y conectar con tus clientes
        </p>
      </div>

      {/* Info box */}
      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
        <AlertCircle size={20} style={{ color: '#AE3F21' }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
            Datos opcionales
          </p>
          <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Puedes omitir este paso si lo deseas. Podrás agregar o actualizar esta información más tarde desde tu perfil.
          </p>
        </div>
      </div>

      {/* Instagram */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Instagram
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Instagram size={20} style={{ color: '#B39A72' }} />
          </div>
          <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none">
            <span style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>@</span>
          </div>
          <input
            type="text"
            value={data.instagram || ''}
            onChange={(e) => {
              const value = e.target.value.replace('@', '')
              updateData({ instagram: value })
              if (errors.instagram) {
                const newErrors = { ...errors }
                delete newErrors.instagram
                setErrors(newErrors)
              }
            }}
            className="w-full pl-16 pr-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.instagram ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="tuusuario"
          />
        </div>
        {errors.instagram ? (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.instagram}
          </p>
        ) : data.instagram?.trim() && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
            <CheckCircle size={14} /> instagram.com/{data.instagram.replace('@', '')}
          </p>
        )}
      </div>

      {/* Facebook */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Facebook
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Facebook size={20} style={{ color: '#B39A72' }} />
          </div>
          <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none text-sm">
            <span style={{ color: '#666', fontFamily: 'Montserrat, sans-serif', fontSize: '12px' }}>
              facebook.com/
            </span>
          </div>
          <input
            type="text"
            value={data.facebook || ''}
            onChange={(e) => {
              updateData({ facebook: e.target.value })
              if (errors.facebook) {
                const newErrors = { ...errors }
                delete newErrors.facebook
                setErrors(newErrors)
              }
            }}
            className="w-full pl-32 pr-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.facebook ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="tuperfil"
          />
        </div>
        {errors.facebook ? (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.facebook}
          </p>
        ) : data.facebook?.trim() && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
            <CheckCircle size={14} /> facebook.com/{data.facebook}
          </p>
        )}
      </div>

      {/* TikTok */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          TikTok
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Music size={20} style={{ color: '#B39A72' }} />
          </div>
          <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none">
            <span style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>@</span>
          </div>
          <input
            type="text"
            value={data.tiktok || ''}
            onChange={(e) => {
              const value = e.target.value.replace('@', '')
              updateData({ tiktok: value })
              if (errors.tiktok) {
                const newErrors = { ...errors }
                delete newErrors.tiktok
                setErrors(newErrors)
              }
            }}
            className="w-full pl-16 pr-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.tiktok ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="tuusuario"
          />
        </div>
        {errors.tiktok ? (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.tiktok}
          </p>
        ) : data.tiktok?.trim() && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
            <CheckCircle size={14} /> tiktok.com/@{data.tiktok.replace('@', '')}
          </p>
        )}
      </div>

      {/* Preview Card */}
      {hasAnyValue && (
        <div className="p-6 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
            ✓ Redes sociales configuradas
          </p>
          <div className="space-y-2">
            {data.instagram?.trim() && (
              <div className="flex items-center gap-2">
                <Instagram size={16} style={{ color: '#B39A72' }} />
                <a
                  href={`https://instagram.com/${data.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline"
                  style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  @{data.instagram.replace('@', '')}
                </a>
              </div>
            )}
            {data.facebook?.trim() && (
              <div className="flex items-center gap-2">
                <Facebook size={16} style={{ color: '#B39A72' }} />
                <a
                  href={`https://facebook.com/${data.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline"
                  style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  facebook.com/{data.facebook}
                </a>
              </div>
            )}
            {data.tiktok?.trim() && (
              <div className="flex items-center gap-2">
                <Music size={16} style={{ color: '#B39A72' }} />
                <a
                  href={`https://tiktok.com/@${data.tiktok.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline"
                  style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  @{data.tiktok.replace('@', '')}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error de submit */}
      {errors.submit && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
          <p className="text-sm" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            {errors.submit}
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:opacity-90"
          style={{ background: '#B39A72', color: '#1a1a1a', fontFamily: 'Montserrat, sans-serif' }}>
          ← Anterior
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90"
            style={{ background: 'rgba(156, 122, 94, 0.3)', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Omitir
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            {loading ? 'Guardando...' : 'Continuar →'}
          </button>
        </div>
      </div>
    </form>
  )
}
