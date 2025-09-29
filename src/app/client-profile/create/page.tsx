'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Wand2, Save, Loader, Building } from 'lucide-react'
import Link from 'next/link'

export default function CreateClientProfilePage() {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [aiInput, setAiInput] = useState('')
  
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
  
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const generateWithAI = async () => {
    if (!aiInput.trim()) {
      alert('Введите описание компании')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/client-profiles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: aiInput }),
      })

      if (response.ok) {
        const data = await response.json()
        const profile = data.profile

        // Заполняем поля сгенерированными данными
        setCompanyName(profile.companyName || '')
        setIndustry(profile.industry || '')
        setPositioning(profile.positioning || '')
        setTargetAudience(profile.targetAudience || ['', '', ''])
        setBrandValues(profile.brandValues || ['', '', '', ''])
        setContentStrategy(profile.contentStrategy || 'viral')
        setToneOfVoice(profile.toneOfVoice || 'friendly')
        
        // Стилевые предпочтения
        const stylePrefs = profile.stylePreferences || {}
        setVideoStyle(stylePrefs.videoStyle || 'amateur')
        setCameraWork(stylePrefs.cameraWork || 'handheld')
        setLighting(stylePrefs.lighting || 'natural')
        setColorPalette(stylePrefs.colorPalette || 'vibrant')
        setMusicStyle(stylePrefs.musicStyle || 'upbeat')
        
        setMainProducts(profile.mainProducts || ['', '', ''])
        setCompetitiveAdvantages(profile.competitiveAdvantages || ['', '', ''])
        setUniqueFeatures(profile.uniqueFeatures || ['', '', ''])
        
        // Переключаемся в режим редактирования
        setMode('manual')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка генерации')
      }
    } catch (error) {
      console.error('Error generating profile:', error)
      alert('Ошибка соединения')
    } finally {
      setGenerating(false)
    }
  }

  const saveProfile = async () => {
    if (!companyName || !industry || !positioning) {
      alert('Заполните обязательные поля: название, отрасль, позиционирование')
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

      const response = await fetch('/api/client-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        const profile = await response.json()
        
        // Автоматически выбираем созданный профиль
        await fetch('/api/client-profiles/select', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profileId: profile.id }),
        })
        
        router.push('/')
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
            <span>Назад к выбору профиля</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Создать профиль клиента</h1>
          <p className="mt-2 text-gray-600">
            Создайте профиль для персонализации генерации видео под ваш бренд
          </p>
        </div>

        {/* Выбор режима */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Режим создания</CardTitle>
            <CardDescription>
              Выберите способ создания профиля клиента
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button
                variant={mode === 'manual' ? 'default' : 'outline'}
                onClick={() => setMode('manual')}
                className="flex-1"
              >
                Заполнить вручную
              </Button>
              <Button
                variant={mode === 'ai' ? 'default' : 'outline'}
                onClick={() => setMode('ai')}
                className="flex-1 flex items-center space-x-2"
              >
                <Wand2 className="h-4 w-4" />
                <span>Сгенерировать с AI</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI генерация */}
        {mode === 'ai' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wand2 className="h-5 w-5" />
                <span>AI генерация профиля</span>
              </CardTitle>
              <CardDescription>
                Опишите вашу компанию, AI создаст полный профиль для видео-маркетинга
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание компании и бизнеса
                </label>
                <Textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Например: 'Мы разрабатываем DeFi платформу для автоматического стейкинга криптовалют. Наша целевая аудитория - опытные крипто-инвесторы. Мы позиционируемся как инновационная и надежная платформа с акцентом на безопасность и высокую доходность. Хотим создавать профессиональный контент с техническими деталями.'"
                  rows={4}
                />
              </div>
              <Button 
                onClick={generateWithAI}
                disabled={generating || !aiInput.trim()}
                className="flex items-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Генерация профиля...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Сгенерировать профиль</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Форма редактирования */}
        {(mode === 'manual' || companyName) && (
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
                    placeholder="Например: CrossFi Technologies"
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
                    placeholder="Например: DeFi & Blockchain Technology"
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
                    placeholder="Как вы позиционируете свою компанию на рынке..."
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
                    <option value="friendly">Дружелюбный (доступный, теплый)</option>
                    <option value="professional">Профессиональный (надежный, экспертный)</option>
                    <option value="authoritative">Авторитетный (уверенный, лидерский)</option>
                    <option value="playful">Игривый (креативный, молодежный)</option>
                    <option value="innovative">Инновационный (передовой, disruptive)</option>
                    <option value="trustworthy">Надежный (безопасный, честный)</option>
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
                    <option value="amateur">Любительский (аутентичный, нативный)</option>
                    <option value="semi-professional">Полупрофессиональный (блогерский)</option>
                    <option value="professional">Профессиональный (студийный)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Работа камеры
                  </label>
                  <Select value={cameraWork} onChange={(e) => setCameraWork(e.target.value)}>
                    <option value="handheld">Ручная съемка (живая, динамичная)</option>
                    <option value="stabilized">Стабилизированная (плавная)</option>
                    <option value="cinematic">Кинематографическая (художественная)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Освещение
                  </label>
                  <Select value={lighting} onChange={(e) => setLighting(e.target.value)}>
                    <option value="natural">Естественное (натуральное)</option>
                    <option value="enhanced">Улучшенное (мягкое)</option>
                    <option value="studio">Студийное (профессиональное)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цветовая палитра
                  </label>
                  <Select value={colorPalette} onChange={(e) => setColorPalette(e.target.value)}>
                    <option value="vibrant">Яркая (насыщенные цвета)</option>
                    <option value="muted">Приглушенная (пастельные тона)</option>
                    <option value="corporate">Корпоративная (деловая)</option>
                    <option value="trendy">Трендовая (современная)</option>
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
                    <span>Сохранить и выбрать профиль</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}


