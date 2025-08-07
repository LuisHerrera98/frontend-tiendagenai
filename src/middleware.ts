import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl
  
  // Extraer el subdominio
  const getSubdomain = (host: string) => {
    const parts = host.split('.')
    // Si tiene al menos 3 partes (subdomain.domain.com), el primero es el subdominio
    if (parts.length >= 3) {
      const possibleSubdomain = parts[0]
      // Ignorar www y api
      if (possibleSubdomain !== 'www' && possibleSubdomain !== 'api') {
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

  // CON SUBDOMINIO - Es una tienda pública
  // Redirigir al storefront público
  if (pathname === '/' || pathname === '') {
    // Aquí mostrará la tienda pública del subdominio
    return NextResponse.rewrite(new URL('/store', request.url))
  }

  // Agregar el subdominio a los headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-subdomain', subdomain)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
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