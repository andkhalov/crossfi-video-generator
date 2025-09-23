'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package, RefreshCw } from 'lucide-react'

interface Product {
  id: string
  name: string
  category: string
  description: string
  data: string
  createdAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const seedProducts = async () => {
    setSeeding(true)
    try {
      const response = await fetch('/api/products/seed', {
        method: 'POST'
      })
      if (response.ok) {
        await loadProducts()
      }
    } catch (error) {
      console.error('Error seeding products:', error)
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    loadProducts()
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
          <h1 className="text-3xl font-bold text-gray-900">Продукты</h1>
          <p className="mt-2 text-gray-600">
            Управляйте описаниями продуктов для генерации видео
          </p>
        </div>

        <div className="mb-6 flex space-x-4">
          <Button size="lg" className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Создать продукт</span>
          </Button>
          
          {products.length === 0 && (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={seedProducts}
              disabled={seeding}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-5 w-5 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Загрузка...' : 'Загрузить демо продукты'}</span>
            </Button>
          )}
        </div>

        {products.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Нет созданных продуктов.<br />
                Создайте новый продукт или загрузите демо данные.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              let productData
              try {
                productData = JSON.parse(product.data)
              } catch {
                productData = {}
              }

              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {product.description}
                    </p>
                    
                    {productData.key_features && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Ключевые особенности:
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {productData.key_features.slice(0, 3).map((feature: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              <span className="line-clamp-2">{feature}</span>
                            </li>
                          ))}
                        </ul>
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
