import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json()

    if (!userInput || userInput.trim().length < 10) {
      return NextResponse.json(
        { error: 'Введите описание продукта (минимум 10 символов)' },
        { status: 400 }
      )
    }

    return new Promise((resolve, reject) => {
      const pythonScript = path.join(process.cwd(), 'python', 'content_generator.py')
      
      const pythonProcess = spawn('/Users/andreykhalov/anaconda3/bin/python3', [
        pythonScript,
        'product',
        userInput,
        'output'
      ], {
        env: {
          ...process.env,
          PYTHONPATH: path.join(process.cwd(), 'python')
        },
        cwd: process.cwd()
      })

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Ищем результат в выводе
            const lines = output.split('\n')
            const resultLine = lines.find(line => line.includes('GENERATED_CONTENT:'))
            
            if (resultLine) {
              const resultJson = resultLine.split('GENERATED_CONTENT:')[1].trim()
              const result = JSON.parse(resultJson)
              
              if (result.status === 'failed') {
                resolve(NextResponse.json(
                  { error: result.error },
                  { status: 500 }
                ))
              } else {
                resolve(NextResponse.json({
                  success: true,
                  product: result
                }))
              }
            } else {
              resolve(NextResponse.json(
                { error: 'Не удалось получить результат от AI' },
                { status: 500 }
              ))
            }
          } catch (error) {
            resolve(NextResponse.json(
              { error: 'Ошибка парсинга результата: ' + (error instanceof Error ? error.message : 'Unknown error') },
              { status: 500 }
            ))
          }
        } else {
          resolve(NextResponse.json(
            { error: `Python процесс завершился с ошибкой (код ${code}): ${errorOutput}` },
            { status: 500 }
          ))
        }
      })

      // Таймаут на 60 секунд
      setTimeout(() => {
        pythonProcess.kill()
        resolve(NextResponse.json(
          { error: 'Таймаут генерации (60 секунд)' },
          { status: 408 }
        ))
      }, 60000)
    })

  } catch (error) {
    console.error('Error generating product:', error)
    return NextResponse.json(
      { error: 'Ошибка генерации продукта' },
      { status: 500 }
    )
  }
}
