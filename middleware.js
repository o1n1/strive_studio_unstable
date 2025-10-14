import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  
  // Obtener el origin de la petición
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  // Lista de orígenes permitidos
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
    'https://localhost:3000',
    `https://${host}`,
    `http://${host}`
  ].filter(Boolean)

  // Para peticiones API, validar origin
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Permitir peticiones del mismo origen (same-origin)
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return NextResponse.json(
        { success: false, error: 'Origin no autorizado' },
        { status: 403 }
      )
    }

    // Agregar headers CORS para orígenes permitidos
    if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }
  }

  // Headers de seguridad adicionales para todas las rutas
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  return response
}

// Configurar qué rutas ejecutan el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}