import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const generations = await db.generation.findMany({
      include: {
        product: true,
        domains: {
          include: {
            domain: true
          }
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(generations)
  } catch (error) {
    console.error('Error fetching generations:', error)
    return NextResponse.json(
      { error: 'Ошибка получения генераций' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, productId, domainIds, userInput } = await request.json()

    // Создаем генерацию
    const generation = await db.generation.create({
      data: {
        name,
        productId,
        userInput: userInput || null,
        status: 'CREATED',
        userId: 'admin',
      },
    })

    // Связываем с доменами
    if (domainIds && domainIds.length > 0) {
      await db.generationDomain.createMany({
        data: domainIds.map((domainId: string) => ({
          generationId: generation.id,
          domainId,
        })),
      })
    }

    // Добавляем лог
    await db.generationLog.create({
      data: {
        generationId: generation.id,
        message: 'Генерация создана',
        level: 'INFO',
      },
    })

    return NextResponse.json(generation)
  } catch (error) {
    console.error('Error creating generation:', error)
    return NextResponse.json(
      { error: 'Ошибка создания генерации' },
      { status: 500 }
    )
  }
}
