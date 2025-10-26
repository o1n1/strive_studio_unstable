export function formatDateInTimezone(date, timezone, options = {}) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    const defaultOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }

    return dateObj.toLocaleString('es-MX', { ...defaultOptions, ...options })
  } catch (error) {
    console.error('❌ Error formateando fecha:', error)
    return 'Fecha inválida'
  }
}

export function formatTimeInTimezone(date, timezone) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    return dateObj.toLocaleTimeString('es-MX', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('❌ Error formateando hora:', error)
    return '--:--'
  }
}

export function getDayOfWeek(date, timezone) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    return dateObj.toLocaleDateString('es-MX', {
      timeZone: timezone,
      weekday: 'long'
    })
  } catch (error) {
    console.error('❌ Error obteniendo día de semana:', error)
    return ''
  }
}

export function formatDateTimeInTimezone(date, timezone) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    return dateObj.toLocaleString('es-MX', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('❌ Error formateando fecha/hora:', error)
    return 'Fecha inválida'
  }
}

export function isToday(date, timezone) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    
    const dateStr = dateObj.toLocaleDateString('es-MX', { timeZone: timezone })
    const todayStr = today.toLocaleDateString('es-MX', { timeZone: timezone })
    
    return dateStr === todayStr
  } catch (error) {
    console.error('❌ Error verificando si es hoy:', error)
    return false
  }
}

export function isTomorrow(date, timezone) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dateStr = dateObj.toLocaleDateString('es-MX', { timeZone: timezone })
    const tomorrowStr = tomorrow.toLocaleDateString('es-MX', { timeZone: timezone })
    
    return dateStr === tomorrowStr
  } catch (error) {
    console.error('❌ Error verificando si es mañana:', error)
    return false
  }
}

export function getRelativeDate(date, timezone) {
  try {
    if (isToday(date, timezone)) {
      return 'Hoy'
    }
    if (isTomorrow(date, timezone)) {
      return 'Mañana'
    }
    
    return formatDateInTimezone(date, timezone, {
      day: 'numeric',
      month: 'long'
    })
  } catch (error) {
    console.error('❌ Error obteniendo fecha relativa:', error)
    return 'Fecha inválida'
  }
}

export function timeToMinutes(timeString) {
  try {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  } catch (error) {
    console.error('❌ Error convirtiendo hora a minutos:', error)
    return 0
  }
}

export function getCurrentDateInTimezone(timezone) {
  try {
    const now = new Date()
    const dateStr = now.toLocaleString('en-US', { timeZone: timezone })
    return new Date(dateStr)
  } catch (error) {
    console.error('❌ Error obteniendo fecha actual:', error)
    return new Date()
  }
}