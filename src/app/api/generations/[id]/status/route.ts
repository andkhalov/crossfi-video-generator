import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const generation = await db.generation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        scenario: true,
        timing: true,
        prompts: true,
        videoFiles: true,
        finalVideo: true,
        enhancedVideo: true,
        updatedAt: true
      }
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'Генерация не найдена' },
        { status: 404 }
      )
    }

    // Возвращаем только статус и ключевые поля для быстрого обновления
    return NextResponse.json({
      id: generation.id,
      status: generation.status,
      hasScenario: !!generation.scenario,
      hasTiming: !!generation.timing,
      hasPrompts: !!generation.prompts,
      hasVideoFiles: !!generation.videoFiles,
      hasFinalVideo: !!generation.finalVideo,
      hasEnhancedVideo: !!generation.enhancedVideo,
      updatedAt: generation.updatedAt,
      // Подсчеты для UI
      promptsCount: generation.prompts ? JSON.parse(generation.prompts).length : 0,
      videoSegmentsCount: generation.videoFiles ? JSON.parse(generation.videoFiles).length : 0
    })

  } catch (error) {
    console.error('Error fetching generation status:', error)
    return NextResponse.json(
      { error: 'Ошибка получения статуса' },
      { status: 500 }
    )
  }
}
