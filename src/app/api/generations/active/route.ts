import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Получаем только активные генерации (не завершенные)
    const activeGenerations = await db.generation.findMany({
      where: {
        status: {
          notIn: ['COMPLETED', 'FAILED']
        }
      },
      include: {
        product: true,
        domains: {
          include: {
            domain: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      active: activeGenerations,
      count: activeGenerations.length
    })
  } catch (error) {
    console.error('Error fetching active generations:', error)
    return NextResponse.json(
      { error: 'Ошибка получения активных генераций' },
      { status: 500 }
    )
  }
}
