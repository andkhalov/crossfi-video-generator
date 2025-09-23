import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Получаем генерацию
    const generation = await db.generation.findUnique({
      where: { id }
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'Генерация не найдена' },
        { status: 404 }
      )
    }

    if (generation.status !== 'COMPLETED' || !generation.finalVideo) {
      return NextResponse.json(
        { error: 'Генерация не завершена или нет финального видео' },
        { status: 400 }
      )
    }

    if (generation.enhancedVideo) {
      return NextResponse.json(
        { error: 'Звук уже улучшен' },
        { status: 400 }
      )
    }

    // Обновляем статус
    await db.generation.update({
      where: { id },
      data: { status: 'ENHANCING_AUDIO' }
    })

    // Добавляем лог
    await db.generationLog.create({
      data: {
        generationId: id,
        message: 'Запуск улучшения звука',
        level: 'INFO',
      },
    })

    // Запускаем Python скрипт для улучшения звука
    const pythonScript = path.join(process.cwd(), 'python', 'audio_enhancer.py')
    
    const pythonProcess = spawn('/Users/andreykhalov/anaconda3/bin/python3', [
      pythonScript,
      generation.finalVideo,
      generation.id
    ], {
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), 'python')
      },
      cwd: process.cwd()
    })

    // Обработка вывода
    pythonProcess.stdout.on('data', async (data) => {
      const output = data.toString()
      console.log('Audio enhancement output:', output)
      
      if (output.includes('ENHANCED_RESULT:')) {
        try {
          const resultJson = output.split('ENHANCED_RESULT:')[1].trim()
          const result = JSON.parse(resultJson)
          
          await db.generation.update({
            where: { id },
            data: {
              enhancedVideo: result.enhanced_video,
              status: 'COMPLETED'
            }
          })
          
          await db.generationLog.create({
            data: {
              generationId: id,
              message: 'Звук успешно улучшен',
              level: 'INFO',
            },
          })
        } catch (error) {
          console.error('Error parsing enhancement result:', error)
        }
      } else {
        const cleanOutput = output.trim()
        if (cleanOutput && !cleanOutput.includes('|') && !cleanOutput.includes('%')) {
          await db.generationLog.create({
            data: {
              generationId: id,
              message: cleanOutput,
              level: 'INFO',
            },
          }).catch(console.error)
        }
      }
    })

    pythonProcess.stderr.on('data', async (data) => {
      const error = data.toString()
      console.error('Audio enhancement error:', error)
      
      const cleanError = error.trim()
      if (cleanError && !cleanError.includes('|') && !cleanError.includes('%')) {
        await db.generationLog.create({
          data: {
            generationId: id,
            message: `Ошибка улучшения звука: ${cleanError}`,
            level: 'ERROR',
          },
        }).catch(console.error)
      }
    })

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        await db.generation.update({
          where: { id },
          data: { status: 'COMPLETED' } // Возвращаем в COMPLETED, так как основное видео готово
        })
        
        await db.generationLog.create({
          data: {
            generationId: id,
            message: `Улучшение звука завершено с ошибкой (код ${code})`,
            level: 'ERROR',
          },
        })
      }
    })

    return NextResponse.json({ 
      message: 'Улучшение звука запущено',
      generationId: id 
    })

  } catch (error) {
    console.error('Error starting audio enhancement:', error)
    return NextResponse.json(
      { error: 'Ошибка запуска улучшения звука' },
      { status: 500 }
    )
  }
}
