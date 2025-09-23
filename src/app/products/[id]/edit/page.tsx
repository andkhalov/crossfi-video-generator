'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader } from 'lucide-react'
import Link from 'next/link'

interface ProductData {
  name: string
  category: string
  description: string
  key_features?: string[]
  consumer_benefits?: string[]
  target_users?: string[]
  technical_specs?: {[key: string]: string}
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [keyFeatures, setKeyFeatures] = useState<string[]>(['', '', '', '', ''])
  const [consumerBenefits, setConsumerBenefits] = useState<string[]>(['', '', ''])
  const [targetUsers, setTargetUsers] = useState<string[]>(['', '', ''])
  const [technicalSpecs, setTechnicalSpecs] = useState<{[key: string]: string}>({
    spec1: '',
    spec2: '',
    spec3: ''
  })

  useEffect(() => {
    loadProduct()
  }, [params.id])

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (response.ok) {
        const product = await response.json()
        const productData: ProductData = JSON.parse(product.data)
        
        setName(product.name)
        setCategory(product.category)
        setDescription(product.description)
        setKeyFeatures(productData.key_features || ['', '', '', '', ''])
        setConsumerBenefits(productData.consumer_benefits || ['', '', ''])
        setTargetUsers(productData.target_users || ['', '', ''])
        setTechnicalSpecs(productData.technical_specs || { spec1: '', spec2: '', spec3: '' })
      }
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProduct = async () => {
    if (!name || !category || !description) {
      alert('Заполните обязательные поля')
      return
    }

    setSaving(true)
    try {
      const productData = {
        name,
        category,
        description,
        key_features: keyFeatures.filter(f => f.trim()),
        consumer_benefits: consumerBenefits.filter(b => b.trim()),
        target_users: targetUsers.filter(u => u.trim()),
        technical_specs: Object.fromEntries(
          Object.entries(technicalSpecs).filter(([_, v]) => v.trim())
        ),
        status: 'Live'
      }

      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category,
          description,
          data: productData
        }),
      })

      if (response.ok) {
        router.push('/products')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка сохранения')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Ошибка соединения')
    } finally {
      setSaving(false)
    }
  }

  const updateKeyFeature = (index: number, value: string) => {
    const newFeatures = [...keyFeatures]
    newFeatures[index] = value
    setKeyFeatures(newFeatures)
  }

  const updateConsumerBenefit = (index: number, value: string) => {
    const newBenefits = [...consumerBenefits]
    newBenefits[index] = value
    setConsumerBenefits(newBenefits)
  }

  const updateTargetUser = (index: number, value: string) => {
    const newUsers = [...targetUsers]
    newUsers[index] = value
    setTargetUsers(newUsers)
  }

  const updateTechnicalSpec = (key: string, value: string) => {
    setTechnicalSpecs(prev => ({ ...prev, [key]: value }))
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
            href="/products"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад к продуктам</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Редактировать продукт</h1>
          <p className="mt-2 text-gray-600">
            Измените описание и характеристики продукта
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveProduct(); }} className="space-y-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название продукта *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категория *
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Ключевые особенности */}
          <Card>
            <CardHeader>
              <CardTitle>Ключевые особенности</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {keyFeatures.map((feature, index) => (
                <Input
                  key={index}
                  value={feature}
                  onChange={(e) => updateKeyFeature(index, e.target.value)}
                  placeholder={`Особенность ${index + 1}`}
                />
              ))}
            </CardContent>
          </Card>

          {/* Преимущества */}
          <Card>
            <CardHeader>
              <CardTitle>Преимущества для пользователей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {consumerBenefits.map((benefit, index) => (
                <Input
                  key={index}
                  value={benefit}
                  onChange={(e) => updateConsumerBenefit(index, e.target.value)}
                  placeholder={`Преимущество ${index + 1}`}
                />
              ))}
            </CardContent>
          </Card>

          {/* Целевые пользователи */}
          <Card>
            <CardHeader>
              <CardTitle>Целевые пользователи</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {targetUsers.map((user, index) => (
                <Input
                  key={index}
                  value={user}
                  onChange={(e) => updateTargetUser(index, e.target.value)}
                  placeholder={`Группа пользователей ${index + 1}`}
                />
              ))}
            </CardContent>
          </Card>

          {/* Технические характеристики */}
          <Card>
            <CardHeader>
              <CardTitle>Технические характеристики</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(technicalSpecs).map(([key, value]) => (
                <div key={key}>
                  <Input
                    value={value}
                    onChange={(e) => updateTechnicalSpec(key, e.target.value)}
                    placeholder={`Техническая характеристика ${key}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href="/products">
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving || !name || !category || !description}
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
