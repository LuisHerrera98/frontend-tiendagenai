import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the request is for admin routes
  if (pathname.startsWith('/admin')) {
    // Check if user is authenticated (has admin session)
    const adminAuth = request.cookies.get('admin-auth')?.value

    // If not authenticated and not on login page, redirect to login
    if (!adminAuth && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // If authenticated and on login page, redirect to dashboard
    if (adminAuth && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}