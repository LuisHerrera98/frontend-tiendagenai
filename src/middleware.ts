import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const pathname = url.pathname

  // En desarrollo, permitir acceso directo a /store/[subdomain] para testing
  if (process.env.NODE_ENV === 'development' && pathname.startsWith('/store/')) {
    return NextResponse.next()
  }

  // Extraer el subdominio
  const getSubdomain = (host: string) => {
    const parts = host.split('.')
    // En producción: subdomain.tiendagenai.com
    // En desarrollo: localhost:3001 (sin subdominio)
    if (parts.length >= 3 || (parts.length === 2 && !host.includes('localhost'))) {
      const possibleSubdomain = parts[0]
      // Ignorar subdominios reservados
      const reserved = ['www', 'api', 'admin', 'app', 'tiendagenai']
      if (!reserved.includes(possibleSubdomain)) {
        return possibleSubdomain
      }
    }
    return null
  }

  const subdomain = getSubdomain(hostname)
  
  // RUTAS PÚBLICAS (sin subdominio)
  if (!subdomain) {
    // Admin panel - permite acceso sin verificación del lado del servidor
    // La verificación de autenticación se hace del lado del cliente
    if (pathname.startsWith('/admin')) {
      return NextResponse.next()
    }

    // Rutas públicas permitidas
    if (pathname.startsWith('/auth') || 
        pathname.startsWith('/api') || 
        pathname.startsWith('/landing') ||
        pathname.startsWith('/store') || // Permitir acceso a /store en desarrollo
        pathname === '/') {
      // Raíz redirige a landing
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/landing', request.url))
      }
      return NextResponse.next()
    }
    
    // Cualquier otra ruta sin subdominio → landing
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  // CON SUBDOMINIO - Es una tienda pública (solo en producción)
  // Si ya está en la ruta /store/[subdomain], no reescribir
  if (pathname.startsWith(`/store/${subdomain}`)) {
    return NextResponse.next()
  }
  
  // Reescribir la URL para usar nuestra ruta dinámica
  url.pathname = `/store/${subdomain}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}