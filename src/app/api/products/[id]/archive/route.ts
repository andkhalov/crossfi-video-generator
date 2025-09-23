import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.update({
      where: { id },
      data: { archived: true }
    })

    return NextResponse.json({
      message: 'Продукт архивирован',
      product
    })
  } catch (error) {
    console.error('Error archiving product:', error)
    return NextResponse.json(
      { error: 'Ошибка архивирования продукта' },
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

    const product = await db.product.update({
      where: { id },
      data: { archived: false }
    })

    return NextResponse.json({
      message: 'Продукт восстановлен из архива',
      product
    })
  } catch (error) {
    console.error('Error unarchiving product:', error)
    return NextResponse.json(
      { error: 'Ошибка восстановления продукта' },
      { status: 500 }
    )
  }
}
