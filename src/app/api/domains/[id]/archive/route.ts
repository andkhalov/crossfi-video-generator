import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const domain = await db.domain.update({
      where: { id },
      data: { archived: true }
    })

    return NextResponse.json({
      message: 'Домен архивирован',
      domain
    })
  } catch (error) {
    console.error('Error archiving domain:', error)
    return NextResponse.json(
      { error: 'Ошибка архивирования домена' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const domain = await db.domain.update({
      where: { id },
      data: { archived: false }
    })

    return NextResponse.json({
      message: 'Домен восстановлен из архива',
      domain
    })
  } catch (error) {
    console.error('Error unarchiving domain:', error)
    return NextResponse.json(
      { error: 'Ошибка восстановления домена' },
      { status: 500 }
    )
  }
}
