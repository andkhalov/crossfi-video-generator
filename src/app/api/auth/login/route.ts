import { NextRequest, NextResponse } from 'next/server'
import { getUser, verifyPassword } from '@/lib/auth'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Проверяем фиксированные креды
    if (username === 'LoreCore' && password === 'lorecore_2025') {
      const token = jwt.sign(
        { username, userId: 'admin' },
        process.env.NEXTAUTH_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      )

      const response = NextResponse.json({ success: true })
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      })

      return response
    }

    return NextResponse.json(
      { error: 'Неверные учетные данные' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
