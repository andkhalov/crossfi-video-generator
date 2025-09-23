import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  // Проверяем, нужна ли авторизация для этого пути
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Проверяем токен авторизации
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret')
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login).*)',
  ],
}
