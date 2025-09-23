import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const profile = await db.clientProfile.findUnique({
      where: { id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching client profile:', error)
    return NextResponse.json(
      { error: 'Ошибка получения профиля' },
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

    const profile = await db.clientProfile.update({
      where: { id },
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
      }
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating client profile:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления профиля' },
      { status: 500 }
    )
  }
}
