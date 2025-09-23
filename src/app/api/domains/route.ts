import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Получаем текущий профиль пользователя
    const user = await db.user.findUnique({
      where: { username: 'LoreCore' }
    })

    if (!user || !user.currentClientProfileId) {
      return NextResponse.json([]) // Возвращаем пустой массив если профиль не выбран
    }

    const domains = await db.domain.findMany({
      where: { 
        archived: false,
        clientProfileId: user.currentClientProfileId
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(domains)
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Ошибка получения доменов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, title, concept, data } = await request.json()

    // Получаем текущий профиль пользователя
    const user = await db.user.findUnique({
      where: { username: 'LoreCore' }
    })

    if (!user || !user.currentClientProfileId) {
      return NextResponse.json(
        { error: 'Профиль клиента не выбран' },
        { status: 400 }
      )
    }

    const domain = await db.domain.create({
      data: {
        key,
        title,
        concept,
        data: JSON.stringify(data),
        archived: false,
        userId: user.id,
        clientProfileId: user.currentClientProfileId,
      },
    })

    return NextResponse.json(domain)
  } catch (error) {
    console.error('Error creating domain:', error)
    return NextResponse.json(
      { error: 'Ошибка создания домена' },
      { status: 500 }
    )
  }
}
