import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    // Получаем пользователя
    const adminUser = await db.user.findUnique({
      where: { id: 'admin' }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 400 }
      )
    }

    // Находим профиль CrossFi
    const crossfiProfile = await db.clientProfile.findFirst({
      where: { 
        companyName: 'CrossFi',
        userId: adminUser.id 
      }
    })

    if (!crossfiProfile) {
      return NextResponse.json(
        { error: 'Профиль CrossFi не найден. Сначала создайте профили через /api/client-profiles/seed' },
        { status: 400 }
      )
    }

    // Читаем данные из products_description.json
    const productsPath = path.join(process.cwd(), 'schema/products_description.json')
    
    let productsData
    try {
      const fileContent = fs.readFileSync(productsPath, 'utf-8')
      productsData = JSON.parse(fileContent)
    } catch (error) {
      return NextResponse.json(
        { error: 'Файл products_description.json не найден' },
        { status: 404 }
      )
    }

    // Удаляем существующие продукты для CrossFi
    await db.product.deleteMany({
      where: { clientProfileId: crossfiProfile.id }
    })

    // Добавляем все продукты CrossFi
    const products = productsData.crossfi_ecosystem_products.products
    const createdProducts = []

    for (const productData of products) {
      const product = await db.product.create({
        data: {
          name: productData.name,
          category: productData.category,
          description: productData.description,
          data: JSON.stringify(productData),
          archived: false,
          userId: adminUser.id,
          clientProfileId: crossfiProfile.id,
        }
      })
      createdProducts.push(product)
    }

    return NextResponse.json({
      message: `Создано ${createdProducts.length} продуктов для CrossFi`,
      products: createdProducts
    })

  } catch (error) {
    console.error('Error seeding CrossFi products:', error)
    return NextResponse.json(
      { error: 'Ошибка создания продуктов CrossFi: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
