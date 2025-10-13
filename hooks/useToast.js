'use client'
import { useState } from 'react'

export default function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const hideToast = () => {
    setToast(null)
  }

  return { toast, showToast, hideToast }
}

// Uso en componentes:
// const { toast, showToast, hideToast } = useToast()
// showToast('Login exitoso!', 'success')
// showToast('Error en el formulario', 'error')