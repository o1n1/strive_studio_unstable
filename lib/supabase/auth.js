import { supabase } from './client'
import { logger } from '@/lib/utils/logger'

export async function registerUser(formData) {
  try {
    logger.log('🔵 Iniciando registro...', { email: formData.email })

    // Obtener la URL base correcta (funciona tanto en desarrollo como producción)
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const redirectUrl = `${baseUrl}/auth/confirm`
    logger.log('📍 Redirect URL configurada:', redirectUrl)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl
      }
    })

    logger.log('📊 Respuesta de Supabase Auth:', { authData, authError })

    if (authError) {
      logger.error('❌ Error de Supabase Auth:', authError)
      throw authError
    }

    if (!authData.user) {
      logger.error('❌ No se creó el usuario')
      throw new Error('No se pudo crear el usuario')
    }

    const userId = authData.user.id
    logger.log('✅ Usuario creado:', userId)

    logger.log('📝 Completando registro...')
    const response = await fetch('/api/complete-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        email: formData.email,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        emergenciaNombre: formData.emergenciaNombre,
        emergenciaTelefono: formData.emergenciaTelefono,
        alergias: formData.alergias || '',
        lesiones: formData.lesiones || '',
        userAgent: navigator.userAgent
      })
    })

    const result = await response.json()
    logger.log('📊 Resultado de completar registro:', result)

    if (!result.success) {
      throw new Error(result.error || 'Error al completar el registro')
    }

    logger.log('✅ Registro completado exitosamente')

    return {
      success: true,
      user: authData.user,
      requiresEmailVerification: true
    }

  } catch (error) {
    logger.error('💥 Error completo en registro:', error)
    return {
      success: false,
      error: error.message || 'Error desconocido en el registro'
    }
  }
}

export async function loginUser(email, password) {
  try {
    logger.log('🔵 Iniciando sesión...', { email })

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    logger.log('📊 Respuesta de login:', { authData, authError })

    if (authError) {
      logger.error('❌ Error de login:', authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error('No se pudo iniciar sesión')
    }

    logger.log('✅ Sesión iniciada:', authData.user.id)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    logger.log('📊 Perfil obtenido:', { profile, profileError })

    if (profileError) {
      logger.error('❌ Error obteniendo perfil:', profileError)
      throw new Error('No se pudo obtener el perfil del usuario')
    }

    if (!profile) {
      throw new Error('Perfil no encontrado')
    }

    logger.log('✅ Login exitoso - Rol:', profile.rol)

    return {
      success: true,
      user: authData.user,
      profile: profile
    }

  } catch (error) {
    logger.error('💥 Error en login:', error)
    return {
      success: false,
      error: error.message || 'Error desconocido al iniciar sesión'
    }
  }
}

export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function resendVerificationEmail(email) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
