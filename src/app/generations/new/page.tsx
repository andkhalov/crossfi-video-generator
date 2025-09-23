'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Play, Package, Globe } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  category: string
  description: string
}

interface Domain {
  id: string
  key: string
  title: string
  concept: string
}

export default function NewGenerationPage() {
  const [name, setName] = useState('')
  const [productId, setProductId] = useState('')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [userInput, setUserInput] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsRes, domainsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/domains')
      ])
      
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }
      
      if (domainsRes.ok) {
        const domainsData = await domainsRes.json()
        setDomains(domainsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleDomainToggle = (domainId: string) => {
    setSelectedDomains(prev => {
      if (prev.includes(domainId)) {
        return prev.filter(id => id !== domainId)
      } else {
        return [...prev, domainId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !productId || selectedDomains.length === 0) {
      alert('Пожалуйста, заполните все обязательные поля')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          productId,
          domainIds: selectedDomains,
          userInput: userInput || null,
        }),
      })

      if (response.ok) {
        const generation = await response.json()
        router.push(`/generations/${generation.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка создания генерации')
      }
    } catch (error) {
      console.error('Error creating generation:', error)
      alert('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
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
            href="/"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад к генерациям</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Создать новое задание</h1>
          <p className="mt-2 text-gray-600">
            Настройте параметры для генерации видео-рекламы
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основные настройки</CardTitle>
              <CardDescription>
                Задайте название и выберите продукт для генерации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название генерации *
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: MetaMask Fox + CrossFi App"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Продукт *
                </label>
                <Select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  <option value="">Выберите продукт</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.category})
                    </option>
                  ))}
                </Select>
                {products.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Нет доступных продуктов. <Link href="/products" className="text-blue-600 hover:underline">Создайте продукт</Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Домены</span>
              </CardTitle>
              <CardDescription>
                Выберите один или несколько стилей для генерации (можно выбрать несколько)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {domains.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Нет доступных доменов. <Link href="/domains" className="text-blue-600 hover:underline">Создайте домен</Link>
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {domains.map((domain) => (
                    <div
                      key={domain.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedDomains.includes(domain.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleDomainToggle(domain.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedDomains.includes(domain.id)}
                          onChange={() => handleDomainToggle(domain.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{domain.title}</h4>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {domain.concept}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Ключ: {domain.key}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Дополнительные настройки</CardTitle>
              <CardDescription>
                Опциональные параметры для кастомизации генерации
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пользовательский ввод (опционально)
                </label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Дополнительные требования или идеи для генерации..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Например: "Сделать акцент на безопасности", "Добавить юмор", "Показать семейную сцену"
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href="/">
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading || !name || !productId || selectedDomains.length === 0}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>{loading ? 'Создание...' : 'Создать генерацию'}</span>
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
