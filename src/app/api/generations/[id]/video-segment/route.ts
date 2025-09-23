import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const index = parseInt(searchParams.get('index') || '0')
    const download = searchParams.get('download') === 'true'

    const generation = await db.generation.findUnique({
      where: { id }
    })

    if (!generation || !generation.videoFiles) {
      return NextResponse.json(
        { error: 'Видео сегменты не найдены' },
        { status: 404 }
      )
    }

    const videoFiles = JSON.parse(generation.videoFiles)
    
    if (index < 0 || index >= videoFiles.length) {
      return NextResponse.json(
        { error: 'Неверный индекс сегмента' },
        { status: 400 }
      )
    }

    const videoPath = videoFiles[index]
    
    if (!fs.existsSync(videoPath)) {
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
    
    const fileName = `generation_${generation.id}_segment_${index + 1}.mp4`
    
    // Возвращаем файл
    const headers: Record<string, string> = {
      'Content-Type': 'video/mp4',
      'Content-Length': fileStats.size.toString(),
      'Accept-Ranges': 'bytes',
    }

    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${fileName}"`
    }

    return new Response(fileBuffer, { headers })

  } catch (error) {
    console.error('Error serving video segment:', error)
    return NextResponse.json(
      { error: 'Ошибка получения видео сегмента' },
      { status: 500 }
    )
  }
}
