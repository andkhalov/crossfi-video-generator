import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domains = await db.domain.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(domains)
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Ошибка получения доменов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, title, concept, data } = await request.json()

    const domain = await db.domain.create({
      data: {
        key,
        title,
        concept,
        data: JSON.stringify(data),
        userId: 'admin',
      },
    })

    return NextResponse.json(domain)
  } catch (error) {
    console.error('Error creating domain:', error)
    return NextResponse.json(
      { error: 'Ошибка создания домена' },
      { status: 500 }
    )
  }
}
