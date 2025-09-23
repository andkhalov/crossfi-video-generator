import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Получаем генерацию с данными
    const generation = await db.generation.findUnique({
      where: { id },
      include: {
        product: true,
        domains: {
          include: {
            domain: true
          }
        }
      }
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'Генерация не найдена' },
        { status: 404 }
      )
    }

    if (generation.status !== 'CREATED') {
      return NextResponse.json(
        { error: 'Генерация уже запущена или завершена' },
        { status: 400 }
      )
    }

    // Обновляем статус
    await db.generation.update({
      where: { id },
      data: { status: 'GENERATING_SCENARIO' }
    })

    // Добавляем лог
    await db.generationLog.create({
      data: {
        generationId: id,
        message: 'Запуск генерации видео',
        level: 'INFO',
      },
    })

    // Запускаем Python скрипт асинхронно
    const pythonScript = path.join(process.cwd(), 'python', 'video_generator.py')
    const domainKey = generation.domains[0]?.domain.key || 'metamask_fox'
    const productData = JSON.parse(generation.product.data)
    
    const pythonProcess = spawn('python3', [
      pythonScript,
      domainKey,
      JSON.stringify(productData),
      generation.id,
      generation.userInput || ''
    ], {
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), 'python')
      }
    })

    // Обработка вывода Python скрипта
    pythonProcess.stdout.on('data', async (data) => {
      const output = data.toString()
      console.log('Python output:', output)
      
      // Добавляем лог в базу
      await db.generationLog.create({
        data: {
          generationId: id,
          message: output.trim(),
          level: 'INFO',
        },
      }).catch(console.error)
    })

    pythonProcess.stderr.on('data', async (data) => {
      const error = data.toString()
      console.error('Python error:', error)
      
      await db.generationLog.create({
        data: {
          generationId: id,
          message: `Ошибка: ${error.trim()}`,
          level: 'ERROR',
        },
      }).catch(console.error)
    })

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        await db.generation.update({
          where: { id },
          data: { status: 'COMPLETED' }
        })
        
        await db.generationLog.create({
          data: {
            generationId: id,
            message: 'Генерация завершена успешно',
            level: 'INFO',
          },
        })
      } else {
        await db.generation.update({
          where: { id },
          data: { status: 'FAILED' }
        })
        
        await db.generationLog.create({
          data: {
            generationId: id,
            message: `Генерация завершена с ошибкой (код ${code})`,
            level: 'ERROR',
          },
        })
      }
    })

    return NextResponse.json({ 
      message: 'Генерация запущена',
      generationId: id 
    })

  } catch (error) {
    console.error('Error starting generation:', error)
    return NextResponse.json(
      { error: 'Ошибка запуска генерации' },
      { status: 500 }
    )
  }
}
