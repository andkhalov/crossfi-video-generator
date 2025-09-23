'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Video, Clock, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Generation {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
  product: {
    name: string
    category: string
  }
  domains: Array<{
    domain: {
      title: string
      key: string
    }
  }>
  finalVideo?: string
  prompts?: string
}

const statusConfig = {
  CREATED: { label: 'Создана', icon: Clock, color: 'text-gray-600' },
  GENERATING_SCENARIO: { label: 'Генерация сценария', icon: Clock, color: 'text-yellow-600' },
  GENERATING_TIMING: { label: 'Определение тайминга', icon: Clock, color: 'text-yellow-600' },
  GENERATING_PROMPTS: { label: 'Генерация промптов', icon: Clock, color: 'text-yellow-600' },
  GENERATING_VIDEOS: { label: 'Генерация видео', icon: Clock, color: 'text-blue-600' },
  CONCATENATING: { label: 'Склейка видео', icon: Clock, color: 'text-blue-600' },
  ENHANCING_AUDIO: { label: 'Улучшение звука', icon: Clock, color: 'text-purple-600' },
  COMPLETED: { label: 'Завершена', icon: CheckCircle, color: 'text-green-600' },
  FAILED: { label: 'Ошибка', icon: XCircle, color: 'text-red-600' },
}

export default function HomePage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  const loadGenerations = async () => {
    try {
      const response = await fetch('/api/generations')
      if (response.ok) {
        const data = await response.json()
        setGenerations(data)
      }
    } catch (error) {
      console.error('Error loading generations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGenerations()
    
    // Автообновление каждые 5 секунд (чаще для лучшего UX)
    const interval = setInterval(() => {
      console.log('Auto-refreshing generations list...')
      loadGenerations()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 px-4">
          <div>Загрузка...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Генерации видео</h1>
          <p className="mt-2 text-gray-600">
            Управляйте процессом создания видео-рекламы для CrossFi
          </p>
        </div>

        <div className="mb-6">
          <Link href="/generations/new">
            <Button size="lg" className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Создать новое задание на генерацию</span>
            </Button>
          </Link>
        </div>

        {generations.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Нет созданных генераций.<br />
                Создайте новое задание для начала работы.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generations.map((generation) => {
              const statusInfo = statusConfig[generation.status as keyof typeof statusConfig] || statusConfig.CREATED
              const StatusIcon = statusInfo.icon
              
              let promptsCount = 0
              let videoDuration = 0
              
              if (generation.prompts) {
                try {
                  const prompts = JSON.parse(generation.prompts)
                  promptsCount = prompts.length
                  videoDuration = prompts.length * 8 // предполагаем 8 секунд на сегмент
                } catch (e) {
                  // Игнорируем ошибки парсинга
                }
              }

              return (
                <Card key={generation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{generation.name}</CardTitle>
                      <div className={`flex items-center space-x-1 ${statusInfo.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm">{statusInfo.label}</span>
                      </div>
                    </div>
                    <CardDescription>
                      Продукт: {generation.product.name} • 
                      Домены: {generation.domains.map(d => d.domain.title).join(', ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Создано:</span>
                        <span>{formatDate(new Date(generation.createdAt))}</span>
                      </div>
                      {generation.status === 'COMPLETED' && promptsCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Видео:</span>
                          <span>{promptsCount} сегмент{promptsCount > 1 ? 'а' : ''}, {videoDuration}с</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Обновлено:</span>
                        <span>{formatDate(new Date(generation.updatedAt))}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <Link href={`/generations/${generation.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Подробнее
                        </Button>
                      </Link>
                      
                      {generation.status === 'COMPLETED' && generation.finalVideo && (
                        <a href={`/api/generations/${generation.id}/download?type=final`} download>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}