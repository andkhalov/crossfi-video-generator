import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const domain = await db.domain.findUnique({
      where: { id }
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Домен не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(domain)
  } catch (error) {
    console.error('Error fetching domain:', error)
    return NextResponse.json(
      { error: 'Ошибка получения домена' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { key, title, concept, data } = await request.json()

    const domain = await db.domain.update({
      where: { id },
      data: {
        key,
        title,
        concept,
        data: JSON.stringify(data),
      }
    })

    return NextResponse.json(domain)
  } catch (error) {
    console.error('Error updating domain:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления домена' },
      { status: 500 }
    )
  }
}
