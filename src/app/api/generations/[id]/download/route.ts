import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'final' // 'final' или 'enhanced'

    const generation = await db.generation.findUnique({
      where: { id }
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'Генерация не найдена' },
        { status: 404 }
      )
    }

    let videoPath: string | null = null
    let fileName: string = ''

    if (type === 'enhanced' && generation.enhancedVideo) {
      videoPath = generation.enhancedVideo
      fileName = `${generation.name}_enhanced.mp4`
    } else if (generation.finalVideo) {
      videoPath = generation.finalVideo
      fileName = `${generation.name}_final.mp4`
    }

    if (!videoPath || !fs.existsSync(videoPath)) {
      return NextResponse.json(
        { error: 'Видео файл не найден' },
        { status: 404 }
      )
    }

    // Читаем файл
    const fileBuffer = fs.readFileSync(videoPath)
    
    // Возвращаем файл
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading video:', error)
    return NextResponse.json(
      { error: 'Ошибка скачивания видео' },
      { status: 500 }
    )
  }
}
