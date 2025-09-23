import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    console.log('Login attempt:', { username, password: '***' })

    // Проверяем фиксированные креды
    if (username === 'LoreCore' && password === 'lorecore_2025') {
      // Создаем или находим пользователя
      let user = await db.user.findUnique({
        where: { username: 'LoreCore' }
      })

      if (!user) {
        user = await db.user.create({
          data: {
            id: 'admin',
            username: 'LoreCore',
            password: 'hashed_password',
          }
        })
        console.log('Created admin user')
      }

      const token = jwt.sign(
        { username, userId: user.id },
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

      console.log('Login successful')
      return response
    }

    console.log('Invalid credentials')
    return NextResponse.json(
      { error: 'Неверные учетные данные' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
