import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await db.user.findUnique({
      where: { username: 'LoreCore' },
      include: { 
        clientProfiles: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Получаем текущий профиль отдельно
    let currentProfile = null
    if (user.currentClientProfileId) {
      currentProfile = await db.clientProfile.findUnique({
        where: { id: user.currentClientProfileId }
      })
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      currentClientProfile: currentProfile,
      hasProfiles: user.clientProfiles.length > 0,
      needsProfileSelection: !currentProfile
    })
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Ошибка получения пользователя' },
      { status: 500 }
    )
  }
}
