import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si no hay sesión en rutas protegidas, redirigir a login
  if (!session && req.nextUrl.pathname.startsWith('/coach')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si hay sesión y está en ruta de coach
  if (session && req.nextUrl.pathname.startsWith('/coach')) {
    // Obtener profile del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', session.user.id)
      .single()

    // Si no es coach, redirigir
    if (profile?.rol !== 'coach') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Obtener datos del coach
    const { data: coach } = await supabase
      .from('coaches')
      .select('estado, activo')
      .eq('id', session.user.id)
      .single()

    // Si coach está pendiente o rechazado y NO está en página de pendiente
    if (
      (coach?.estado === 'pendiente' || coach?.estado === 'rechazado' || !coach?.activo) &&
      req.nextUrl.pathname !== '/coach/pendiente'
    ) {
      return NextResponse.redirect(new URL('/coach/pendiente', req.url))
    }

    // Si coach está activo pero intenta acceder a página de pendiente
    if (
      coach?.estado === 'activo' && 
      coach?.activo === true &&
      req.nextUrl.pathname === '/coach/pendiente'
    ) {
      return NextResponse.redirect(new URL('/coach/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/coach/:path*']
}