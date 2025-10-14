import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  console.log('🔵 Endpoint /auth/confirm llamado')
  console.log('Token hash:', token_hash ? '✅' : '❌')
  console.log('Type:', type)

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    console.log('Verificación OTP:', error ? '❌' : '✅')
    
    if (!error) {
      console.log('✅ Email verificado, redirigiendo...')
      // Construir URL completa para el redirect
      const origin = requestUrl.origin
      const redirectUrl = `${origin}/verificacion-exitosa`
      console.log('Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('❌ Error verificando OTP:', error)
      const origin = requestUrl.origin
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`)
    }
  }

  // Si no hay token, redirigir al inicio
  console.log('⚠️ No hay token, redirigiendo al inicio')
  const origin = requestUrl.origin
  return NextResponse.redirect(origin)
}
