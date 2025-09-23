'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader } from 'lucide-react'

interface DomainData {
  key: string
  title: string
  concept: string
  locations?: string
  characters?: string
  mood?: string
  shooting_features?: string
  sample_dialogues?: string[]
  length?: number[]
  rating?: number
}

export default function EditDomainPage() {
  const params = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    loadDomain()
  }, [params.id])

  const loadDomain = async () => {
    try {
      const response = await fetch(`/api/domains/${params.id}`)
      if (response.ok) {
        const domain = await response.json()
        const domainData: DomainData = JSON.parse(domain.data)
        
        setKey(domain.key)
        setTitle(domain.title)
        setConcept(domain.concept)
        setLocations(domainData.locations || '')
        setCharacters(domainData.characters || '')
        setMood(domainData.mood || '')
        setShootingFeatures(domainData.shooting_features || '')
        setSampleDialogues(domainData.sample_dialogues || ['', '', ''])
        setLengthProbs(domainData.length || [0.6, 0.3, 0.1])
        setRating(domainData.rating || 5)
      }
    } catch (error) {
      console.error('Error loading domain:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveDomain = async () => {
    if (!key || !title || !concept) {
      alert('Заполните обязательные поля')
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

      const response = await fetch(`/api/domains/${params.id}`, {
        method: 'PUT',
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
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/domains"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад к доменам</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Редактировать домен</h1>
          <p className="mt-2 text-gray-600">
            Измените параметры и стиль домена
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveDomain(); }} className="space-y-6">
          {/* Основная информация */}
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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название домена *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Визуальные характеристики */}
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Особенности съемки
                </label>
                <Textarea
                  value={shootingFeatures}
                  onChange={(e) => setShootingFeatures(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Примеры диалогов */}
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

          {/* Настройки */}
          <Card>
            <CardHeader>
              <CardTitle>Дополнительные настройки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вероятности длительности
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">8с</label>
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
                    <label className="block text-xs text-gray-600 mb-1">16с</label>
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
                    <label className="block text-xs text-gray-600 mb-1">24с</label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Рейтинг (1-10)
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
