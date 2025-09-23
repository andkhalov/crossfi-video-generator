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
      fileName = `generation_${generation.id}_enhanced.mp4`
    } else if (generation.finalVideo) {
      videoPath = generation.finalVideo
      fileName = `generation_${generation.id}_final.mp4`
    }

    if (!videoPath || !fs.existsSync(videoPath)) {
      return NextResponse.json(
        { error: 'Видео файл не найден' },
        { status: 404 }
      )
    }

    // Читаем файл как поток
    const fileStats = fs.statSync(videoPath)
    const fileStream = fs.createReadStream(videoPath)
    
    // Конвертируем поток в буфер
    const chunks: Buffer[] = []
    for await (const chunk of fileStream) {
      chunks.push(chunk)
    }
    const fileBuffer = Buffer.concat(chunks)
    
    // Возвращаем файл с правильными заголовками
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileStats.size.toString(),
        'Accept-Ranges': 'bytes',
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
