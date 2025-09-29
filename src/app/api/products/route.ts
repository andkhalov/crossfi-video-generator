import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Получаем текущий профиль пользователя
    const user = await db.user.findUnique({
      where: { username: 'CrossFi' }
    })

    if (!user || !user.currentClientProfileId) {
      return NextResponse.json([]) // Возвращаем пустой массив если профиль не выбран
    }

    const products = await db.product.findMany({
      where: { 
        archived: false,
        clientProfileId: user.currentClientProfileId
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Ошибка получения продуктов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, category, description, data } = await request.json()

    // Получаем текущий профиль пользователя
    const user = await db.user.findUnique({
      where: { username: 'CrossFi' }
    })

    if (!user || !user.currentClientProfileId) {
      return NextResponse.json(
        { error: 'Профиль клиента не выбран' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        category,
        description,
        data: JSON.stringify(data),
        archived: false,
        userId: user.id,
        clientProfileId: user.currentClientProfileId,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Ошибка создания продукта' },
      { status: 500 }
    )
  }
}
