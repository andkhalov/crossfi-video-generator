import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const profiles = await db.clientProfile.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Error fetching client profiles:', error)
    return NextResponse.json(
      { error: 'Ошибка получения профилей клиентов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      companyName,
      industry,
      positioning,
      targetAudience,
      brandValues,
      contentStrategy,
      toneOfVoice,
      stylePreferences,
      mainProducts,
      competitiveAdvantages,
      uniqueFeatures
    } = await request.json()

    const profile = await db.clientProfile.create({
      data: {
        companyName,
        industry,
        positioning,
        targetAudience: JSON.stringify(targetAudience),
        brandValues: JSON.stringify(brandValues),
        contentStrategy,
        toneOfVoice,
        stylePreferences: JSON.stringify(stylePreferences),
        mainProducts: JSON.stringify(mainProducts),
        competitiveAdvantages: JSON.stringify(competitiveAdvantages),
        uniqueFeatures: JSON.stringify(uniqueFeatures),
        userId: 'admin',
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating client profile:', error)
    return NextResponse.json(
      { error: 'Ошибка создания профиля клиента' },
      { status: 500 }
    )
  }
}
