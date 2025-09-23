import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json()

    if (!userInput || userInput.trim().length < 20) {
      return NextResponse.json(
        { error: 'Введите подробное описание клиента (минимум 20 символов)' },
        { status: 400 }
      )
    }

    return new Promise((resolve, reject) => {
      const pythonScript = path.join(process.cwd(), 'python', 'client_profile_generator.py')
      
      const pythonProcess = spawn('/Users/andreykhalov/anaconda3/bin/python3', [
        pythonScript,
        userInput
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
            const lines = output.split('\n')
            const resultLine = lines.find(line => line.includes('GENERATED_PROFILE:'))
            
            if (resultLine) {
              const resultJson = resultLine.split('GENERATED_PROFILE:')[1].trim()
              const result = JSON.parse(resultJson)
              
              if (result.status === 'failed') {
                resolve(NextResponse.json(
                  { error: result.error },
                  { status: 500 }
                ))
              } else {
                resolve(NextResponse.json({
                  success: true,
                  profile: result
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

      setTimeout(() => {
        pythonProcess.kill()
        resolve(NextResponse.json(
          { error: 'Таймаут генерации (90 секунд)' },
          { status: 408 }
        ))
      }, 90000)
    })

  } catch (error) {
    console.error('Error generating client profile:', error)
    return NextResponse.json(
      { error: 'Ошибка генерации профиля клиента' },
      { status: 500 }
    )
  }
}
