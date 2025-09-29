import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    // Читаем данные из products_description.json
    const productsPath = path.join(process.cwd(), '../../schema/products_description.json')
    
    let productsData
    try {
      const fileContent = fs.readFileSync(productsPath, 'utf-8')
      productsData = JSON.parse(fileContent)
    } catch (error) {
      // Если файл не найден, используем демо данные
      productsData = {
        crossfi_ecosystem_products: {
          products: [
            {
              id: 1,
              name: "CrossFi App",
              category: "Crypto Banking & Payment Solution",
              description: "Comprehensive crypto banking application that bridges traditional finance with cryptocurrency",
              key_features: [
                "Non-custodial crypto transactions",
                "Multi-currency debit cards",
                "Cross-border transfers",
                "MetaMask integration"
              ],
              consumer_benefits: [
                "Full custody control",
                "Instant crypto-to-fiat conversion",
                "Bypass banking limitations"
              ]
            },
            {
              id: 2,
              name: "XFI Token",
              category: "Utility Token & Network Currency",
              description: "Primary utility token providing access to all CrossFi ecosystem applications",
              key_features: [
                "Universal access token",
                "Gas payments for EVM transactions",
                "Limited emission",
                "Cross-chain compatibility"
              ],
              consumer_benefits: [
                "Single token access to ecosystem",
                "Appreciation potential",
                "Lower transaction costs"
              ]
            }
          ]
        }
      }
    }

    // Получаем пользователя и его текущий профиль
    const adminUser = await db.user.findUnique({
      where: { username: 'CrossFi' }
    })

    if (!adminUser || !adminUser.currentClientProfileId) {
      return NextResponse.json(
        { error: 'Пользователь не найден или не выбран профиль клиента' },
        { status: 400 }
      )
    }

    // Удаляем существующие продукты для этого клиента
    await db.product.deleteMany({
      where: { clientProfileId: adminUser.currentClientProfileId }
    })

    // Добавляем продукты из файла
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
          clientProfileId: adminUser.currentClientProfileId,
        }
      })
      createdProducts.push(product)
    }

    return NextResponse.json({
      message: `Создано ${createdProducts.length} продуктов`,
      products: createdProducts
    })
  } catch (error) {
    console.error('Error seeding products:', error)
    return NextResponse.json(
      { error: 'Ошибка инициализации продуктов' },
      { status: 500 }
    )
  }
}
