import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Email verificado exitosamente - redirigir al dashboard del cliente
      return NextResponse.redirect(new URL('/verificacion-exitosa', request.url))
    } else {
      // Error en la verificación
      return NextResponse.redirect(new URL(`/error?message=${error.message}`, request.url))
    }
  }

  // Si no hay token, redirigir al inicio
  return NextResponse.redirect(new URL('/', request.url))
}