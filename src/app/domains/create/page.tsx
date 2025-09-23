'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Wand2, Save, Loader } from 'lucide-react'
import Link from 'next/link'

export default function CreateDomainPage() {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [aiInput, setAiInput] = useState('')
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [concept, setConcept] = useState('')
  const [locations, setLocations] = useState('')
  const [characters, setCharacters] = useState('')
  const [mood, setMood] = useState('')
  const [shootingFeatures, setShootingFeatures] = useState('')
  const [sampleDialogues, setSampleDialogues] = useState<string[]>(['', '', ''])
  const [lengthProbs, setLengthProbs] = useState<number[]>([0.6, 0.3, 0.1])
  const [rating, setRating] = useState(5)
  
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const generateWithAI = async () => {
    if (!aiInput.trim()) {
      alert('Введите описание домена')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/domains/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: aiInput }),
      })

      if (response.ok) {
        const data = await response.json()
        const domain = data.domain

        // Заполняем поля сгенерированными данными
        setKey(domain.key || '')
        setTitle(domain.title || '')
        setConcept(domain.concept || '')
        setLocations(domain.locations || '')
        setCharacters(domain.characters || '')
        setMood(domain.mood || '')
        setShootingFeatures(domain.shooting_features || '')
        setSampleDialogues(domain.sample_dialogues || ['', '', ''])
        setLengthProbs(domain.length || [0.6, 0.3, 0.1])
        setRating(domain.rating || 5)
        
        // Переключаемся в режим редактирования
        setMode('manual')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка генерации')
      }
    } catch (error) {
      console.error('Error generating domain:', error)
      alert('Ошибка соединения')
    } finally {
      setGenerating(false)
    }
  }

  const saveDomain = async () => {
    if (!key || !title || !concept) {
      alert('Заполните обязательные поля: ключ, название, концепция')
      return
    }

    setSaving(true)
    try {
      const domainData = {
        key,
        title,
        concept,
        locations,
        characters,
        mood,
        shooting_features: shootingFeatures,
        sample_dialogues: sampleDialogues.filter(d => d.trim()),
        length: lengthProbs,
        rating
      }

      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          title,
          concept,
          data: domainData
        }),
      })

      if (response.ok) {
        router.push('/domains')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка сохранения')
      }
    } catch (error) {
      console.error('Error saving domain:', error)
      alert('Ошибка соединения')
    } finally {
      setSaving(false)
    }
  }

  const updateDialogue = (index: number, value: string) => {
    const newDialogues = [...sampleDialogues]
    newDialogues[index] = value
    setSampleDialogues(newDialogues)
  }

  const updateLengthProb = (index: number, value: number) => {
    const newProbs = [...lengthProbs]
    newProbs[index] = value
    setLengthProbs(newProbs)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/domains"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад к доменам</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Создать домен</h1>
          <p className="mt-2 text-gray-600">
            Создайте новый стиль видео вручную или с помощью AI
          </p>
        </div>

        {/* Выбор режима */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Режим создания</CardTitle>
            <CardDescription>
              Выберите способ создания домена
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
                <span>AI генерация домена</span>
              </CardTitle>
              <CardDescription>
                Опишите стиль видео на естественном языке, AI создаст полное описание
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание стиля домена
                </label>
                <Textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Например: 'Видео в стиле новостных сводок с профессиональными ведущими и серьезной подачей' или 'Забавные видео с антропоморфными животными в повседневных ситуациях'"
                  rows={3}
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
                    <span>Генерация...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Сгенерировать</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Форма редактирования */}
        {(mode === 'manual' || title) && (
          <form onSubmit={(e) => { e.preventDefault(); saveDomain(); }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ключ домена *
                  </label>
                  <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Например: professional_news"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Уникальный идентификатор (только латинские буквы, цифры и подчеркивания)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название домена *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Professional News Reports"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Концепция *
                  </label>
                  <Textarea
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="Подробное описание стиля и подхода к видео..."
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Визуальные характеристики</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Локации
                  </label>
                  <Textarea
                    value={locations}
                    onChange={(e) => setLocations(e.target.value)}
                    placeholder="Типичные места съемки (через запятую)"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Персонажи
                  </label>
                  <Textarea
                    value={characters}
                    onChange={(e) => setCharacters(e.target.value)}
                    placeholder="Описание типичных персонажей и их характеристик"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Настроение
                  </label>
                  <Input
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="Эмоциональный тон (через запятую)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Особенности съемки
                  </label>
                  <Textarea
                    value={shootingFeatures}
                    onChange={(e) => setShootingFeatures(e.target.value)}
                    placeholder="Стиль камеры, освещение, цветокоррекция"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Примеры диалогов</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sampleDialogues.map((dialogue, index) => (
                  <Input
                    key={index}
                    value={dialogue}
                    onChange={(e) => updateDialogue(index, e.target.value)}
                    placeholder={`Пример диалога ${index + 1}`}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Настройки длительности</CardTitle>
                <CardDescription>
                  Вероятностное распределение для длительности видео
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      8 секунд
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={lengthProbs[0]}
                      onChange={(e) => updateLengthProb(0, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      16 секунд
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={lengthProbs[1]}
                      onChange={(e) => updateLengthProb(1, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      24 секунды
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={lengthProbs[2]}
                      onChange={(e) => updateLengthProb(2, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Сумма должна быть равна 1.0. Например: 0.6, 0.3, 0.1
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Рейтинг</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Вирусный потенциал (1-10)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value) || 5)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Link href="/domains">
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={saving || !key || !title || !concept}
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
                    <span>Сохранить домен</span>
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
