import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params

    // Удаляем профиль и все связанные данные
    await db.clientProfile.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Профиль клиента удален' })
  } catch (error) {
    console.error('Error deleting client profile:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления профиля клиента' },
      { status: 500 }
    )
  }
}