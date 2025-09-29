import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json()

    // Проверяем, что профиль существует
    const profile = await db.clientProfile.findUnique({
      where: { id: profileId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Обновляем текущий профиль пользователя
    await db.user.update({
      where: { id: 'admin' },
      data: { currentClientProfileId: profileId }
    })

    return NextResponse.json({
      message: 'Профиль выбран',
      profile
    })
  } catch (error) {
    console.error('Error selecting client profile:', error)
    return NextResponse.json(
      { error: 'Ошибка выбора профиля' },
      { status: 500 }
    )
  }
}
