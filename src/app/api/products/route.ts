import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const products = await db.product.findMany({
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

    const product = await db.product.create({
      data: {
        name,
        category,
        description,
        data: JSON.stringify(data),
        userId: 'admin', // Фиксированный пользователь
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
