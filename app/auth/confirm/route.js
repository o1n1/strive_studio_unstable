import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error && data.session) {
      // Establecer cookies manualmente para mantener la sesión
      const cookieStore = await cookies()
      
      // Crear las cookies de sesión necesarias
      cookieStore.set('sb-access-token', data.session.access_token, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 días
      })

      cookieStore.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 días
      })

      // Redirigir a verificación exitosa
      return NextResponse.redirect(new URL('/verificacion-exitosa', request.url))
    } else {
      // Error en la verificación
      return NextResponse.redirect(new URL(`/error?message=${error?.message || 'Error en verificación'}`, request.url))
    }
  }

  // Si no hay token, redirigir al inicio
  return NextResponse.redirect(new URL('/', request.url))
}
