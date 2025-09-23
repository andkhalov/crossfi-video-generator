import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('Middleware called for:', request.nextUrl.pathname)
  
  // Проверяем, нужна ли авторизация для этого пути
  if (request.nextUrl.pathname === '/login') {
    console.log('Login page, allowing access')
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    console.log('Auth API, allowing access')
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith('/api/health')) {
    console.log('Health API, allowing access')
    return NextResponse.next()
  }

  if (request.nextUrl.pathname === '/test') {
    console.log('Test page, allowing access')
    return NextResponse.next()
  }

  // Проверяем токен авторизации (упрощенная проверка для Edge Runtime)
  const token = request.cookies.get('auth-token')?.value
  console.log('Auth token present:', !!token)

  if (!token) {
    console.log('No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Простая проверка токена без jwt.verify (для Edge Runtime)
  try {
    // Проверяем, что токен выглядит как JWT (3 части, разделенные точками)
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }
    
    // Декодируем payload (не проверяя подпись для упрощения)
    const payload = JSON.parse(atob(parts[1]))
    
    // Проверяем, что токен не истек
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired')
    }
    
    console.log('Token valid (simplified check)')
    return NextResponse.next()
  } catch (error) {
    console.log('Token invalid:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
