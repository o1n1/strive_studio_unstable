// Validaciones reutilizables

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validatePassword = (password) => {
  // Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return regex.test(password)
}

export const validatePhone = (phone) => {
  // Formato: 10 dígitos
  const regex = /^\d{10}$/
  return regex.test(phone.replace(/\D/g, ''))
}

export const validateRFC = (rfc) => {
  const regex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/
  return regex.test(rfc.toUpperCase())
}

// Mensajes de error
export const errorMessages = {
  required: 'Este campo es requerido',
  invalidEmail: 'Email inválido',
  invalidPassword: 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número',
  invalidPhone: 'Teléfono inválido (10 dígitos)',
  invalidRFC: 'RFC inválido',
  passwordMismatch: 'Las contraseñas no coinciden'
}