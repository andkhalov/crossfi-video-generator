'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Building, Wand2, CheckCircle, Edit } from 'lucide-react'
import Link from 'next/link'

interface ClientProfile {
  id: string
  companyName: string
  industry: string
  positioning: string
  contentStrategy: string
  toneOfVoice: string
  createdAt: string
}

interface UserData {
  currentClientProfile: ClientProfile | null
  hasProfiles: boolean
  needsProfileSelection: boolean
}

export default function ClientProfilePage() {
  const [profiles, setProfiles] = useState<ClientProfile[]>([])
  const [currentProfile, setCurrentProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const [profilesRes, userRes] = await Promise.all([
        fetch('/api/client-profiles'),
        fetch('/api/user/current')
      ])
      
      if (profilesRes.ok) {
        const data = await profilesRes.json()
        setProfiles(data)
      }
      
      if (userRes.ok) {
        const userData: UserData = await userRes.json()
        setCurrentProfile(userData.currentClientProfile)
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectProfile = async (profileId: string) => {
    try {
      const response = await fetch('/api/client-profiles/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      })

      if (response.ok) {
        // Обновляем текущий профиль и перезагружаем данные
        await loadProfiles()
        // Не перенаправляем автоматически, позволяем пользователю видеть изменения
      } else {
        alert('Ошибка выбора профиля')
      }
    } catch (error) {
      console.error('Error selecting profile:', error)
      alert('Ошибка соединения')
    }
  }

  const createDemoProfiles = async () => {
    try {
      const response = await fetch('/api/client-profiles/seed', {
        method: 'POST'
      })

      if (response.ok) {
        await loadProfiles()
      } else {
        alert('Ошибка создания демо профилей')
      }
    } catch (error) {
      console.error('Error creating demo profiles:', error)
      alert('Ошибка соединения')
    }
  }

  const loadDemoData = async (companyName: string, dataType: 'products' | 'domains') => {
    try {
      let endpoint = ''
      
      if (companyName === 'CrossFi') {
        endpoint = dataType === 'products' ? '/api/products/seed-crossfi' : '/api/domains/seed-crossfi'
      } else if (companyName === 'Lomonosov School') {
        endpoint = dataType === 'products' ? '/api/products/seed-lomonosov' : '/api/domains/seed-lomonosov'
      } else {
        alert('Демо данные доступны только для CrossFi и Lomonosov School')
        return
      }

      const response = await fetch(endpoint, {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка загрузки демо данных')
      }
    } catch (error) {
      console.error('Error loading demo data:', error)
      alert('Ошибка соединения')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <div>Загрузка...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Профили клиентов</h1>
          <p className="mt-2 text-gray-600">
            Выберите профиль для персонализации генерации видео под ваш бренд
          </p>
          
          {currentProfile && (
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span>Текущий профиль: <strong>{currentProfile.companyName}</strong></span>
            </div>
          )}
        </div>

        <div className="mb-6 flex justify-center space-x-4">
          <Link href="/client-profile/create">
            <Button size="lg" className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Создать новый профиль</span>
            </Button>
          </Link>
          
          {profiles.length === 0 && (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={createDemoProfiles}
              className="flex items-center space-x-2"
            >
              <Building className="h-5 w-5" />
              <span>Создать демо профили</span>
            </Button>
          )}
        </div>

        {profiles.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300 max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Нет созданных профилей клиентов.<br />
                Создайте новый профиль или загрузите профиль CrossFi.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => {
              const isSelected = currentProfile?.id === profile.id
              
              return (
                <Card 
                  key={profile.id} 
                  className={`hover:shadow-lg transition-shadow cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="h-5 w-5 text-blue-600" />
                        <span>{profile.companyName}</span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Активен</span>
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription>{profile.industry}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {profile.positioning}
                    </p>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Стратегия:</span>
                        <span className="capitalize">{profile.contentStrategy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Тон:</span>
                        <span className="capitalize">{profile.toneOfVoice}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={() => selectProfile(profile.id)}
                        variant={isSelected ? "secondary" : "default"}
                        className="w-full flex items-center space-x-2"
                        disabled={isSelected}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>{isSelected ? 'Выбран' : 'Выбрать профиль'}</span>
                      </Button>
                      
                      <div className="flex space-x-1">
                        <Link href={`/client-profile/${profile.id}/edit`} className="flex-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs flex items-center space-x-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Редактировать</span>
                          </Button>
                        </Link>
                      </div>
                      
                      {isSelected && (
                        <div className="flex space-x-1 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs"
                            onClick={() => loadDemoData(profile.companyName, 'products')}
                          >
                            📦 Продукты
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs"
                            onClick={() => loadDemoData(profile.companyName, 'domains')}
                          >
                            🎭 Домены
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Профиль клиента определяет стиль, тон и подход к генерации видео.<br />
            Вы можете переключаться между профилями в любое время.
          </p>
        </div>
      </main>
    </div>
  )
}
