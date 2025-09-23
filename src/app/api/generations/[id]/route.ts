import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const generation = await db.generation.findUnique({
      where: { id },
      include: {
        product: true,
        domains: {
          include: {
            domain: true
          }
        },
        logs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'Генерация не найдена' },
        { status: 404 }
      )
    }

    return NextResponse.json(generation)
  } catch (error) {
    console.error('Error fetching generation:', error)
    return NextResponse.json(
      { error: 'Ошибка получения генерации' },
      { status: 500 }
    )
  }
}
