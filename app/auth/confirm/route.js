import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  logger.log('🔵 Endpoint /auth/confirm llamado')
  logger.log('Token hash:', token_hash ? '✅' : '❌')
  logger.log('Type:', type)

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    logger.log('Verificación OTP:', error ? '❌' : '✅')
    
    if (!error) {
      logger.success('Email verificado, redirigiendo...')
      const origin = requestUrl.origin
      const redirectUrl = `${origin}/verificacion-exitosa`
      logger.log('Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else {
      logger.error('❌ Error verificando OTP:', error)
      const origin = requestUrl.origin
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`)
    }
  }

  // Si no hay token, redirigir al inicio
  logger.warn('⚠️ No hay token, redirigiendo al inicio')
  const origin = requestUrl.origin
  return NextResponse.redirect(origin)
}