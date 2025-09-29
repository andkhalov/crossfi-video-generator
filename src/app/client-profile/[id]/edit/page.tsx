'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Save, Loader, Building } from 'lucide-react'
import Link from 'next/link'

export default function EditClientProfilePage() {
  const params = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Основная информация
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [positioning, setPositioning] = useState('')
  
  // Аудитория и ценности
  const [targetAudience, setTargetAudience] = useState<string[]>(['', '', ''])
  const [brandValues, setBrandValues] = useState<string[]>(['', '', '', ''])
  
  // Контентная стратегия
  const [contentStrategy, setContentStrategy] = useState('viral')
  const [toneOfVoice, setToneOfVoice] = useState('friendly')
  
  // Стилевые предпочтения
  const [videoStyle, setVideoStyle] = useState('amateur')
  const [cameraWork, setCameraWork] = useState('handheld')
  const [lighting, setLighting] = useState('natural')
  const [colorPalette, setColorPalette] = useState('vibrant')
  const [musicStyle, setMusicStyle] = useState('upbeat')
  
  // Продуктовая информация
  const [mainProducts, setMainProducts] = useState<string[]>(['', '', ''])
  const [competitiveAdvantages, setCompetitiveAdvantages] = useState<string[]>(['', '', ''])
  const [uniqueFeatures, setUniqueFeatures] = useState<string[]>(['', '', ''])

  useEffect(() => {
    loadProfile()
  }, [params.id])

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/client-profiles/${params.id}`)
      if (response.ok) {
        const profile = await response.json()
        
        // Заполняем поля данными профиля
        setCompanyName(profile.companyName)
        setIndustry(profile.industry)
        setPositioning(profile.positioning)
        setTargetAudience(JSON.parse(profile.targetAudience))
        setBrandValues(JSON.parse(profile.brandValues))
        setContentStrategy(profile.contentStrategy)
        setToneOfVoice(profile.toneOfVoice)
        
        // Стилевые предпочтения
        const stylePrefs = JSON.parse(profile.stylePreferences)
        setVideoStyle(stylePrefs.videoStyle || 'amateur')
        setCameraWork(stylePrefs.cameraWork || 'handheld')
        setLighting(stylePrefs.lighting || 'natural')
        setColorPalette(stylePrefs.colorPalette || 'vibrant')
        setMusicStyle(stylePrefs.musicStyle || 'upbeat')
        
        setMainProducts(JSON.parse(profile.mainProducts))
        setCompetitiveAdvantages(JSON.parse(profile.competitiveAdvantages))
        setUniqueFeatures(JSON.parse(profile.uniqueFeatures))
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!companyName || !industry || !positioning) {
      alert('Заполните обязательные поля')
      return
    }

    setSaving(true)
    try {
      const profileData = {
        companyName,
        industry,
        positioning,
        targetAudience: targetAudience.filter(a => a.trim()),
        brandValues: brandValues.filter(v => v.trim()),
        contentStrategy,
        toneOfVoice,
        stylePreferences: {
          videoStyle,
          cameraWork,
          lighting,
          colorPalette,
          musicStyle
        },
        mainProducts: mainProducts.filter(p => p.trim()),
        competitiveAdvantages: competitiveAdvantages.filter(a => a.trim()),
        uniqueFeatures: uniqueFeatures.filter(f => f.trim())
      }

      const response = await fetch(`/api/client-profiles/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        router.push('/client-profile')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка сохранения')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Ошибка соединения')
    } finally {
      setSaving(false)
    }
  }

  const updateTargetAudience = (index: number, value: string) => {
    const newAudience = [...targetAudience]
    newAudience[index] = value
    setTargetAudience(newAudience)
  }

  const updateBrandValue = (index: number, value: string) => {
    const newValues = [...brandValues]
    newValues[index] = value
    setBrandValues(newValues)
  }

  const updateMainProduct = (index: number, value: string) => {
    const newProducts = [...mainProducts]
    newProducts[index] = value
    setMainProducts(newProducts)
  }

  const updateCompetitiveAdvantage = (index: number, value: string) => {
    const newAdvantages = [...competitiveAdvantages]
    newAdvantages[index] = value
    setCompetitiveAdvantages(newAdvantages)
  }

  const updateUniqueFeature = (index: number, value: string) => {
    const newFeatures = [...uniqueFeatures]
    newFeatures[index] = value
    setUniqueFeatures(newFeatures)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <div>Загрузка профиля...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/client-profile"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад к профилям</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Редактировать профиль</h1>
          <p className="mt-2 text-gray-600">
            Измените параметры профиля клиента для персонализации генерации
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }} className="space-y-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Основная информация о компании</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название компании *
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Отрасль *
                </label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Позиционирование бренда *
                </label>
                <Textarea
                  value={positioning}
                  onChange={(e) => setPositioning(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Контентная стратегия */}
          <Card>
            <CardHeader>
              <CardTitle>Контентная стратегия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип контента *
                </label>
                <Select
                  value={contentStrategy}
                  onChange={(e) => setContentStrategy(e.target.value)}
                  required
                >
                  <option value="viral">Вирусный (мемы, тренды, нативная реклама)</option>
                  <option value="professional">Профессиональный (корпоративный, полированный)</option>
                  <option value="educational">Образовательный (обучающий, информативный)</option>
                  <option value="technical">Технический (детальный, B2B фокус)</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тон голоса *
                </label>
                <Select
                  value={toneOfVoice}
                  onChange={(e) => setToneOfVoice(e.target.value)}
                  required
                >
                  <option value="friendly">Дружелюбный</option>
                  <option value="professional">Профессиональный</option>
                  <option value="authoritative">Авторитетный</option>
                  <option value="playful">Игривый</option>
                  <option value="innovative">Инновационный</option>
                  <option value="trustworthy">Надежный</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Визуальные предпочтения */}
          <Card>
            <CardHeader>
              <CardTitle>Визуальные предпочтения</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Стиль видео
                </label>
                <Select value={videoStyle} onChange={(e) => setVideoStyle(e.target.value)}>
                  <option value="amateur">Любительский</option>
                  <option value="semi-professional">Полупрофессиональный</option>
                  <option value="professional">Профессиональный</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Работа камеры
                </label>
                <Select value={cameraWork} onChange={(e) => setCameraWork(e.target.value)}>
                  <option value="handheld">Ручная съемка</option>
                  <option value="stabilized">Стабилизированная</option>
                  <option value="cinematic">Кинематографическая</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Освещение
                </label>
                <Select value={lighting} onChange={(e) => setLighting(e.target.value)}>
                  <option value="natural">Естественное</option>
                  <option value="enhanced">Улучшенное</option>
                  <option value="studio">Студийное</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цветовая палитра
                </label>
                <Select value={colorPalette} onChange={(e) => setColorPalette(e.target.value)}>
                  <option value="vibrant">Яркая</option>
                  <option value="muted">Приглушенная</option>
                  <option value="corporate">Корпоративная</option>
                  <option value="trendy">Трендовая</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Целевая аудитория */}
          <Card>
            <CardHeader>
              <CardTitle>Целевая аудитория</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {targetAudience.map((audience, index) => (
                <Input
                  key={index}
                  value={audience}
                  onChange={(e) => updateTargetAudience(index, e.target.value)}
                  placeholder={`Группа аудитории ${index + 1}`}
                />
              ))}
            </CardContent>
          </Card>

          {/* Ценности бренда */}
          <Card>
            <CardHeader>
              <CardTitle>Ценности бренда</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {brandValues.map((value, index) => (
                <Input
                  key={index}
                  value={value}
                  onChange={(e) => updateBrandValue(index, e.target.value)}
                  placeholder={`Ценность ${index + 1}`}
                />
              ))}
            </CardContent>
          </Card>

          {/* Основные продукты */}
          <Card>
            <CardHeader>
              <CardTitle>Основные продукты/услуги</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mainProducts.map((product, index) => (
                <Input
                  key={index}
                  value={product}
                  onChange={(e) => updateMainProduct(index, e.target.value)}
                  placeholder={`Продукт/услуга ${index + 1}`}
                />
              ))}
            </CardContent>
          </Card>

          {/* Конкурентные преимущества */}
          <Card>
            <CardHeader>
              <CardTitle>Конкурентные преимущества</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {competitiveAdvantages.map((advantage, index) => (
                <Input
                  key={index}
                  value={advantage}
                  onChange={(e) => updateCompetitiveAdvantage(index, e.target.value)}
                  placeholder={`Преимущество ${index + 1}`}
                />
              ))}
            </CardContent>
          </Card>

          {/* Уникальные особенности */}
          <Card>
            <CardHeader>
              <CardTitle>Уникальные особенности</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {uniqueFeatures.map((feature, index) => (
                <Input
                  key={index}
                  value={feature}
                  onChange={(e) => updateUniqueFeature(index, e.target.value)}
                  placeholder={`Уникальная особенность ${index + 1}`}
                />
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href="/client-profile">
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving || !companyName || !industry || !positioning}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Сохранить изменения</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}


