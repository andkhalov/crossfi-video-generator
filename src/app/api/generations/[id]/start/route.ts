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

    // Подготавливаем данные для Python скрипта
    const pythonScript = path.join(process.cwd(), 'python', 'video_generator_v2.py')
    const domainKey = generation.domains[0]?.domain.key || 'metamask_fox'
    const productData = JSON.parse(generation.product.data)
    
    // Получаем данные домена из базы
    const domainData = generation.domains[0]?.domain ? JSON.parse(generation.domains[0].domain.data) : {}
    
    // Получаем профиль клиента
    const clientProfile = await db.clientProfile.findUnique({
      where: { id: generation.clientProfileId }
    })
    
    if (!clientProfile) {
      return NextResponse.json(
        { error: 'Профиль клиента не найден' },
        { status: 404 }
      )
    }

    // Подготавливаем полные данные для скрипта
    const generationData = {
      domainKey,
      domainData,
      productData,
      clientProfile: {
        companyName: clientProfile.companyName,
        industry: clientProfile.industry,
        positioning: clientProfile.positioning,
        targetAudience: JSON.parse(clientProfile.targetAudience),
        brandValues: JSON.parse(clientProfile.brandValues),
        contentStrategy: clientProfile.contentStrategy,
        toneOfVoice: clientProfile.toneOfVoice,
        stylePreferences: JSON.parse(clientProfile.stylePreferences),
        mainProducts: JSON.parse(clientProfile.mainProducts),
        competitiveAdvantages: JSON.parse(clientProfile.competitiveAdvantages),
        uniqueFeatures: JSON.parse(clientProfile.uniqueFeatures)
      },
      generationId: generation.id,
      userInput: generation.userInput || '',
      language: generation.language || 'Portuguese'
    }
    
    const pythonProcess = spawn('/Users/andreykhalov/anaconda3/bin/python3', [
      pythonScript,
      JSON.stringify(generationData)
    ], {
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), 'python')
      },
      cwd: process.cwd()
    })

    // Обработка вывода Python скрипта
    pythonProcess.stdout.on('data', async (data) => {
      const output = data.toString()
      console.log('Python output:', output)
      
      // Проверяем на промежуточные результаты
      if (output.includes('INTERMEDIATE_RESULT:')) {
        try {
          const lines = output.split('\n')
          const resultLine = lines.find(line => line.includes('INTERMEDIATE_RESULT:'))
          if (!resultLine) return
          
          const resultJson = resultLine.split('INTERMEDIATE_RESULT:')[1].trim()
          console.log('Raw intermediate result JSON:', resultJson)
          const result = JSON.parse(resultJson)
          
          // Обновляем генерацию с промежуточными результатами
          const updateData: any = {}
          
          console.log('Processing intermediate result step:', result.step)
          
          if (result.step === 'scenario') {
            updateData.scenario = result.scenario
            updateData.status = 'GENERATING_TIMING'
            console.log('Scenario saved, length:', result.scenario.length)
          } else if (result.step === 'timing') {
            updateData.scenario = result.scenario
            updateData.timing = result.timing ? result.timing.toString() : null
            updateData.status = 'GENERATING_PROMPTS'
            console.log('Timing saved:', result.timing)
          } else if (result.step === 'prompts') {
            updateData.scenario = result.scenario
            updateData.timing = result.timing ? result.timing.toString() : null
            updateData.prompts = result.prompts ? JSON.stringify(result.prompts) : null
            updateData.status = 'GENERATING_VIDEOS'
            console.log('Prompts saved, count:', result.prompts ? result.prompts.length : 0)
          } else if (result.step === 'videos') {
            updateData.scenario = result.scenario
            updateData.timing = result.timing ? result.timing.toString() : null
            updateData.prompts = result.prompts ? JSON.stringify(result.prompts) : null
            updateData.videoFiles = result.video_segments ? JSON.stringify(result.video_segments) : null
            updateData.status = 'CONCATENATING'
            console.log('Video segments saved, count:', result.video_segments ? result.video_segments.length : 0)
          }
          
          console.log(`Updating generation with step: ${result.step}`, updateData)
          
          await db.generation.update({
            where: { id },
            data: updateData
          })
          
          await db.generationLog.create({
            data: {
              generationId: id,
              message: `Этап "${result.step}" завершен`,
              level: 'INFO',
            },
          })
          
          console.log(`Generation updated for step: ${result.step}`)
        } catch (error) {
          console.error('Error parsing intermediate result:', error)
        }
      } else if (output.includes('GENERATION_RESULT:')) {
        try {
          const resultJson = output.split('GENERATION_RESULT:')[1].trim()
          const result = JSON.parse(resultJson)
          
          // Обновляем генерацию с финальными результатами
          await db.generation.update({
            where: { id },
            data: {
              scenario: result.scenario,
              timing: result.timing ? result.timing.toString() : null,
              prompts: result.prompts ? JSON.stringify(result.prompts) : null,
              videoFiles: result.video_segments ? JSON.stringify(result.video_segments) : null,
              finalVideo: result.final_video || null,
              status: 'COMPLETED'
            }
          })
          
          await db.generationLog.create({
            data: {
              generationId: id,
              message: 'Генерация полностью завершена',
              level: 'INFO',
            },
          })
        } catch (error) {
          console.error('Error parsing generation result:', error)
        }
      } else {
        // Обычные логи (фильтруем MoviePy progress bars)
        const cleanOutput = output.trim()
        if (cleanOutput && !cleanOutput.includes('|') && !cleanOutput.includes('%') && !cleanOutput.includes('it/s')) {
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
      console.error('Python error:', error)
      
      // Фильтруем MoviePy progress bars из stderr тоже
      const cleanError = error.trim()
      if (cleanError && !cleanError.includes('|') && !cleanError.includes('%') && !cleanError.includes('it/s') && !cleanError.includes('chunk:')) {
        await db.generationLog.create({
          data: {
            generationId: id,
            message: `Ошибка: ${cleanError}`,
            level: 'ERROR',
          },
        }).catch(console.error)
      }
    })

    pythonProcess.on('close', async (code) => {
      console.log(`Python process finished with code: ${code}`)
      
      // Получаем текущее состояние генерации
      const currentGeneration = await db.generation.findUnique({
        where: { id }
      })
      
      if (code === 0) {
        // Если процесс завершился успешно, но статус еще не COMPLETED
        if (currentGeneration?.status !== 'COMPLETED') {
          await db.generation.update({
            where: { id },
            data: { status: 'COMPLETED' }
          })
        }
        
        await db.generationLog.create({
          data: {
            generationId: id,
            message: 'Python процесс завершен успешно',
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
            message: `Python процесс завершен с ошибкой (код ${code})`,
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
