'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Clock, CheckCircle, XCircle, AlertCircle, Download, RefreshCw, Package, Globe } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Generation {
  id: string
  name: string
  status: string
  userInput?: string
  scenario?: string
  timing?: string
  prompts?: string
  videoFiles?: string
  finalVideo?: string
  enhancedVideo?: string
  createdAt: string
  updatedAt: string
  product: {
    id: string
    name: string
    category: string
    description: string
  }
  domains: Array<{
    domain: {
      id: string
      key: string
      title: string
      concept: string
    }
  }>
  logs: Array<{
    id: string
    message: string
    level: string
    createdAt: string
  }>
}

const statusConfig = {
  CREATED: { label: 'Создана', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
  GENERATING_SCENARIO: { label: 'Генерация сценария', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  GENERATING_TIMING: { label: 'Определение тайминга', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  GENERATING_PROMPTS: { label: 'Генерация промптов', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  GENERATING_VIDEOS: { label: 'Генерация видео', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  CONCATENATING: { label: 'Склейка видео', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  ENHANCING_AUDIO: { label: 'Улучшение звука', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
  COMPLETED: { label: 'Завершена', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  FAILED: { label: 'Ошибка', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
}

const logLevelConfig = {
  DEBUG: { color: 'text-gray-600' },
  INFO: { color: 'text-blue-600' },
  WARN: { color: 'text-yellow-600' },
  ERROR: { color: 'text-red-600' },
}

export default function GenerationDetailsPage() {
  const params = useParams()
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [enhancing, setEnhancing] = useState(false)

  const loadGeneration = async () => {
    try {
      const response = await fetch(`/api/generations/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Generation data loaded:', {
          id: data.id,
          status: data.status,
          hasScenario: !!data.scenario,
          hasTiming: !!data.timing,
          hasPrompts: !!data.prompts,
          hasVideoFiles: !!data.videoFiles,
          hasFinalVideo: !!data.finalVideo
        })
        setGeneration(data)
        return data
      }
    } catch (error) {
      console.error('Error loading generation:', error)
    } finally {
      setLoading(false)
    }
    return null
  }

  const startGeneration = async () => {
    setStarting(true)
    try {
      const response = await fetch(`/api/generations/${params.id}/start`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Перезагружаем данные
        await loadGeneration()
        
        // Начинаем периодическое обновление
        const interval = setInterval(async () => {
          await loadGeneration()
        }, 3000)
        
        // Останавливаем обновление через 5 минут
        setTimeout(() => clearInterval(interval), 300000)
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка запуска генерации')
      }
    } catch (error) {
      console.error('Error starting generation:', error)
      alert('Ошибка соединения')
    } finally {
      setStarting(false)
    }
  }

  const enhanceAudio = async () => {
    setEnhancing(true)
    try {
      const response = await fetch(`/api/generations/${params.id}/enhance-audio`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadGeneration()
        
        // Начинаем периодическое обновление
        const interval = setInterval(async () => {
          await loadGeneration()
        }, 3000)
        
        // Останавливаем обновление через 10 минут
        setTimeout(() => clearInterval(interval), 600000)
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка запуска улучшения звука')
      }
    } catch (error) {
      console.error('Error enhancing audio:', error)
      alert('Ошибка соединения')
    } finally {
      setEnhancing(false)
    }
  }

  useEffect(() => {
    loadGeneration()
    
    // Быстрое автообновление статуса
    const statusInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generations/${params.id}/status`)
        if (response.ok) {
          const statusData = await response.json()
          
          // Если статус изменился или появились новые данные, загружаем полные данные
          if (!generation || 
              statusData.status !== generation.status ||
              statusData.hasScenario !== !!generation.scenario ||
              statusData.hasPrompts !== !!generation.prompts ||
              statusData.hasVideoFiles !== !!generation.videoFiles ||
              statusData.hasFinalVideo !== !!generation.finalVideo) {
            
            console.log('Status changed, reloading full data...')
            await loadGeneration()
          }
          
          // Останавливаем обновление если генерация завершена
          if (['COMPLETED', 'FAILED'].includes(statusData.status)) {
            clearInterval(statusInterval)
          }
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }
    }, 1000) // Проверяем статус каждую секунду

    return () => clearInterval(statusInterval)
  }, [params.id, generation?.status])

  // Отдельный эффект для первой загрузки
  useEffect(() => {
    loadGeneration()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto py-6 px-4">
          <div>Загрузка...</div>
        </main>
      </div>
    )
  }

  if (!generation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto py-6 px-4">
          <div>Генерация не найдена</div>
        </main>
      </div>
    )
  }

  const StatusIcon = statusConfig[generation.status as keyof typeof statusConfig]?.icon || AlertCircle
  const statusInfo = statusConfig[generation.status as keyof typeof statusConfig] || statusConfig.CREATED

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад к генерациям</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{generation.name}</h1>
              <p className="mt-2 text-gray-600">
                Создана {formatDate(new Date(generation.createdAt))}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${statusInfo.bg}`}>
                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                <span className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              
              {generation.status === 'CREATED' && (
                <Button 
                  onClick={startGeneration}
                  disabled={starting}
                  className="flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>{starting ? 'Запуск...' : 'Запустить генерацию'}</span>
                </Button>
              )}
              
              {generation.status === 'COMPLETED' && generation.finalVideo && (
                <div className="flex space-x-2">
                  <a href={`/api/generations/${generation.id}/download?type=final`} download>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Скачать видео</span>
                    </Button>
                  </a>
                  
                  {!generation.enhancedVideo && generation.status !== 'ENHANCING_AUDIO' && (
                    <Button 
                      variant="secondary" 
                      className="flex items-center space-x-2"
                      onClick={enhanceAudio}
                      disabled={enhancing}
                    >
                      <span>🎵</span>
                      <span>{enhancing ? 'Улучшение...' : 'Улучшить звук'}</span>
                    </Button>
                  )}
                  
                  {generation.status === 'ENHANCING_AUDIO' && (
                    <Button 
                      variant="secondary" 
                      disabled
                      className="flex items-center space-x-2"
                    >
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Улучшение звука...</span>
                    </Button>
                  )}
                  
                  {generation.enhancedVideo && (
                    <a href={`/api/generations/${generation.id}/download?type=enhanced`} download>
                      <Button variant="outline" className="flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Скачать с улучшенным звуком</span>
                      </Button>
                    </a>
                  )}
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={loadGeneration}
                className="flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Обновить</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Конфигурация */}
            <Card>
              <CardHeader>
                <CardTitle>Конфигурация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">{generation.product.name}</h4>
                    <p className="text-sm text-gray-600">{generation.product.category}</p>
                    <p className="text-sm text-gray-500 mt-1">{generation.product.description}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Домены</h4>
                    <div className="space-y-2 mt-1">
                      {generation.domains.map((domainRel) => (
                        <div key={domainRel.domain.id} className="text-sm">
                          <span className="font-medium text-gray-700">{domainRel.domain.title}</span>
                          <span className="text-gray-500 ml-2">({domainRel.domain.key})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {generation.userInput && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Пользовательский ввод</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {generation.userInput}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Прогресс генерации */}
            <Card>
              <CardHeader>
                <CardTitle>Прогресс генерации</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Этап 1: Сценарий */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      generation.scenario ? 'bg-green-100 text-green-600' : 
                      ['GENERATING_SCENARIO'].includes(generation.status) ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {generation.scenario ? '✓' : 
                       ['GENERATING_SCENARIO'].includes(generation.status) ? '⏳' : '1'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Генерация сценария</h4>
                      <p className="text-sm text-gray-600">
                        {generation.scenario ? 'Сценарий готов' :
                         ['GENERATING_SCENARIO'].includes(generation.status) ? 'Создаем сценарий...' :
                         'Ожидание'}
                      </p>
                    </div>
                  </div>

                  {/* Этап 2: Тайминг */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      generation.timing ? 'bg-green-100 text-green-600' : 
                      ['GENERATING_TIMING'].includes(generation.status) ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {generation.timing ? '✓' : 
                       ['GENERATING_TIMING'].includes(generation.status) ? '⏳' : '2'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Определение тайминга</h4>
                      <p className="text-sm text-gray-600">
                        {generation.timing ? `Длительность: ${generation.timing}s` :
                         ['GENERATING_TIMING'].includes(generation.status) ? 'Определяем оптимальный тайминг...' :
                         'Ожидание'}
                      </p>
                    </div>
                  </div>

                  {/* Этап 3: Промпты */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      generation.prompts ? 'bg-green-100 text-green-600' : 
                      ['GENERATING_PROMPTS'].includes(generation.status) ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {generation.prompts ? '✓' : 
                       ['GENERATING_PROMPTS'].includes(generation.status) ? '⏳' : '3'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Создание промптов</h4>
                      <p className="text-sm text-gray-600">
                        {generation.prompts ? `${JSON.parse(generation.prompts).length} промптов готово` :
                         ['GENERATING_PROMPTS'].includes(generation.status) ? 'Создаем промпты для VEO3...' :
                         'Ожидание'}
                      </p>
                    </div>
                  </div>

                  {/* Этап 4: Видео */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      generation.videoFiles ? 'bg-green-100 text-green-600' : 
                      ['GENERATING_VIDEOS'].includes(generation.status) ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {generation.videoFiles ? '✓' : 
                       ['GENERATING_VIDEOS'].includes(generation.status) ? '🎬' : '4'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Генерация видео</h4>
                      <p className="text-sm text-gray-600">
                        {generation.videoFiles ? `${JSON.parse(generation.videoFiles).length} сегментов готово` :
                         ['GENERATING_VIDEOS'].includes(generation.status) ? 'Генерируем видео через VEO3...' :
                         'Ожидание'}
                      </p>
                    </div>
                  </div>

                  {/* Этап 5: Склейка */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      generation.finalVideo ? 'bg-green-100 text-green-600' : 
                      ['CONCATENATING'].includes(generation.status) ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {generation.finalVideo ? '✓' : 
                       ['CONCATENATING'].includes(generation.status) ? '🎞️' : '5'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Склейка видео</h4>
                      <p className="text-sm text-gray-600">
                        {generation.finalVideo ? 'Финальное видео готово' :
                         ['CONCATENATING'].includes(generation.status) ? 'Склеиваем сегменты...' :
                         'Ожидание'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Результаты */}
            {(generation.scenario || generation.prompts) && (
              <Card>
                <CardHeader>
                  <CardTitle>Детальные результаты</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {generation.scenario && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Сценарий</h4>
                      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{generation.scenario}</pre>
                      </div>
                    </div>
                  )}

                  {generation.prompts && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Промпты для VEO3</h4>
                      <div className="space-y-3">
                        {JSON.parse(generation.prompts).map((prompt: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Сегмент {index + 1}
                              </span>
                              <span className="text-xs text-gray-500">
                                {prompt.duration} • {prompt.aspect_ratio}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {prompt.prompt}
                            </p>
                            {generation.videoFiles && (
                              <div className="text-xs text-blue-600">
                                ✅ Видео сегмент сгенерирован
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {generation.videoFiles && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Видео сегменты</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {JSON.parse(generation.videoFiles).map((videoPath: string, index: number) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Сегмент {index + 1}
                              </span>
                              <span className="text-xs text-green-600">✅ Готов</span>
                            </div>
                            <video 
                              controls 
                              className="w-full rounded border"
                              style={{ maxHeight: '200px' }}
                            >
                              <source src={`/api/generations/${generation.id}/video-segment?index=${index}`} type="video/mp4" />
                              Ваш браузер не поддерживает видео.
                            </video>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                {videoPath.split('/').pop()}
                              </span>
                              <a 
                                href={`/api/generations/${generation.id}/video-segment?index=${index}&download=true`} 
                                download
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Скачать
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {generation.finalVideo && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Финальное видео</h4>
                      <div className="border rounded-lg p-4 bg-green-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            {generation.finalVideo.split('/').pop()}
                          </span>
                          <span className="text-xs text-green-600">✅ Готово</span>
                        </div>
                        <video 
                          controls 
                          className="w-full rounded border"
                          style={{ maxHeight: '400px' }}
                        >
                          <source src={`/api/generations/${generation.id}/download?type=final`} type="video/mp4" />
                          Ваш браузер не поддерживает видео.
                        </video>
                        <div className="mt-3 flex justify-center">
                          <a href={`/api/generations/${generation.id}/download?type=final`} download>
                            <Button variant="outline" className="flex items-center space-x-2">
                              <Download className="h-4 w-4" />
                              <span>Скачать финальное видео</span>
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {generation.enhancedVideo && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Видео с улучшенным звуком</h4>
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            {generation.enhancedVideo.split('/').pop()}
                          </span>
                          <span className="text-xs text-blue-600">🎵 Звук улучшен</span>
                        </div>
                        <video 
                          controls 
                          className="w-full rounded border"
                          style={{ maxHeight: '400px' }}
                        >
                          <source src={`/api/generations/${generation.id}/download?type=enhanced`} type="video/mp4" />
                          Ваш браузер не поддерживает видео.
                        </video>
                        <div className="mt-3 flex justify-center">
                          <a href={`/api/generations/${generation.id}/download?type=enhanced`} download>
                            <Button variant="outline" className="flex items-center space-x-2">
                              <Download className="h-4 w-4" />
                              <span>Скачать улучшенное видео</span>
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Логи */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Лог выполнения</CardTitle>
                <CardDescription>
                  Последние события генерации
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {generation.logs.length === 0 ? (
                    <p className="text-sm text-gray-500">Нет событий</p>
                  ) : (
                    generation.logs.map((log) => {
                      const levelConfig = logLevelConfig[log.level as keyof typeof logLevelConfig] || logLevelConfig.INFO
                      return (
                        <div key={log.id} className="text-sm border-l-2 border-gray-200 pl-3">
                          <div className="flex items-start justify-between">
                            <p className={`${levelConfig.color} flex-1`}>
                              {log.message}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(new Date(log.createdAt))}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
