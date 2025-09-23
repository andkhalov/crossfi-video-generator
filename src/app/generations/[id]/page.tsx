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

  const loadGeneration = async () => {
    try {
      const response = await fetch(`/api/generations/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setGeneration(data)
      }
    } catch (error) {
      console.error('Error loading generation:', error)
    } finally {
      setLoading(false)
    }
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

  useEffect(() => {
    loadGeneration()
    
    // Автообновление для активных генераций
    const interval = setInterval(() => {
      if (generation && !['COMPLETED', 'FAILED'].includes(generation.status)) {
        loadGeneration()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [params.id, generation?.status])

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
                <Button variant="outline" className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Скачать видео</span>
                </Button>
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

            {/* Результаты */}
            {(generation.scenario || generation.prompts) && (
              <Card>
                <CardHeader>
                  <CardTitle>Результаты генерации</CardTitle>
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
                            <p className="text-sm text-gray-600">
                              {prompt.prompt}
                            </p>
                          </div>
                        ))}
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
