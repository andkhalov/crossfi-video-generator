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
        { error: 'Профиль CrossFi не найден' },
        { status: 400 }
      )
    }

    // Читаем данные из domains_v6.json
    const domainsPath = path.join(process.cwd(), 'domains_v6.json')
    
    let domainsData
    try {
      const fileContent = fs.readFileSync(domainsPath, 'utf-8')
      domainsData = JSON.parse(fileContent)
    } catch (error) {
      return NextResponse.json(
        { error: 'Файл domains_v6.json не найден' },
        { status: 404 }
      )
    }

    // Удаляем существующие домены для CrossFi
    await db.domain.deleteMany({
      where: { clientProfileId: crossfiProfile.id }
    })

    // Добавляем все домены CrossFi
    const domains = domainsData.domains
    const createdDomains = []

    for (const [key, domainData] of Object.entries(domains)) {
      const domain = await db.domain.create({
        data: {
          key,
          title: (domainData as any).title,
          concept: (domainData as any).concept,
          data: JSON.stringify(domainData),
          archived: false,
          userId: adminUser.id,
          clientProfileId: crossfiProfile.id,
        }
      })
      createdDomains.push(domain)
    }

    return NextResponse.json({
      message: `Создано ${createdDomains.length} доменов для CrossFi`,
      domains: createdDomains
    })

  } catch (error) {
    console.error('Error seeding CrossFi domains:', error)
    return NextResponse.json(
      { error: 'Ошибка создания доменов CrossFi: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
