'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Globe, RefreshCw, Star } from 'lucide-react'

interface Domain {
  id: string
  key: string
  title: string
  concept: string
  data: string
  createdAt: string
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/domains')
      if (response.ok) {
        const data = await response.json()
        setDomains(data)
      }
    } catch (error) {
      console.error('Error loading domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const seedDomains = async () => {
    setSeeding(true)
    try {
      const response = await fetch('/api/domains/seed', {
        method: 'POST'
      })
      if (response.ok) {
        await loadDomains()
      }
    } catch (error) {
      console.error('Error seeding domains:', error)
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    loadDomains()
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
          <h1 className="text-3xl font-bold text-gray-900">Домены</h1>
          <p className="mt-2 text-gray-600">
            Управляйте стилями и контекстами для генерации видео
          </p>
        </div>

        <div className="mb-6 flex space-x-4">
          <Button size="lg" className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Создать домен</span>
          </Button>
          
          {domains.length === 0 && (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={seedDomains}
              disabled={seeding}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-5 w-5 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Загрузка...' : 'Загрузить демо домены'}</span>
            </Button>
          )}
        </div>

        {domains.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Globe className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Нет созданных доменов.<br />
                Создайте новый домен или загрузите демо данные.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {domains.map((domain) => {
              let domainData
              try {
                domainData = JSON.parse(domain.data)
              } catch {
                domainData = {}
              }

              return (
                <Card key={domain.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{domain.title}</CardTitle>
                        <CardDescription className="text-xs text-gray-500 mt-1">
                          Ключ: {domain.key}
                        </CardDescription>
                      </div>
                      {domainData.rating && (
                        <div className="flex items-center space-x-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm">{domainData.rating}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {domain.concept}
                    </p>
                    
                    {domainData.mood && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Настроение:
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {domainData.mood}
                        </p>
                      </div>
                    )}

                    {domainData.sample_dialogues && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Примеры диалогов:
                        </h4>
                        <div className="space-y-1">
                          {domainData.sample_dialogues.slice(0, 2).map((dialogue: string, index: number) => (
                            <p key={index} className="text-xs text-gray-600 italic line-clamp-2">
                              "{dialogue}"
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {domainData.length && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Вероятности длительности:
                        </h4>
                        <div className="flex space-x-2 text-xs">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            8s: {Math.round(domainData.length[0] * 100)}%
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            16s: {Math.round(domainData.length[1] * 100)}%
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            24s: {Math.round(domainData.length[2] * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Редактировать
                      </Button>
                      <Button variant="ghost" size="sm">
                        Подробнее
                      </Button>
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
