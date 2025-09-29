import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Создаем пользователя admin если его нет
    let adminUser = await db.user.findUnique({
      where: { id: 'admin' }
    })

    if (!adminUser) {
      adminUser = await db.user.create({
        data: {
          id: 'admin',
          username: 'CrossFi',
          password: 'hashed_password',
        }
      })
    }

    // Удаляем существующие профили
    await db.clientProfile.deleteMany()

    // Профиль CrossFi
    const crossfiProfile = await db.clientProfile.create({
      data: {
        companyName: "CrossFi",
        industry: "DeFi & Blockchain Technology",
        positioning: "Bridging traditional finance with decentralized finance through user-friendly crypto banking solutions that make Web3 accessible to everyone",
        targetAudience: JSON.stringify([
          "Crypto enthusiasts and early adopters",
          "Unbanked and underbanked populations globally", 
          "Traditional finance users seeking crypto adoption",
          "DeFi users looking for real-world utility"
        ]),
        brandValues: JSON.stringify([
          "Financial freedom and independence",
          "Accessibility and inclusion",
          "Security and non-custodial control",
          "Innovation and cutting-edge technology",
          "Decentralization and user empowerment"
        ]),
        contentStrategy: "viral",
        toneOfVoice: "friendly",
        stylePreferences: JSON.stringify({
          videoStyle: "amateur",
          cameraWork: "handheld", 
          lighting: "natural",
          colorPalette: "vibrant",
          musicStyle: "upbeat"
        }),
        mainProducts: JSON.stringify([
          "CrossFi App - Crypto banking with real-world spending",
          "XFI Token - Utility token for ecosystem access",
          "MPX Token - Governance and staking token",
          "Native Staking - Passive income generation",
          "xApp - Comprehensive DeFi platform"
        ]),
        competitiveAdvantages: JSON.stringify([
          "Non-custodial security with banking convenience",
          "Direct MetaMask integration without intermediaries",
          "Real-world crypto spending through debit cards",
          "Dual-token economic model for sustainability"
        ]),
        uniqueFeatures: JSON.stringify([
          "First true crypto banking solution",
          "Seamless fiat-crypto bridge",
          "Unlimited scalability with Cosmos+EVM architecture",
          "Global accessibility regardless of banking status"
        ]),
        userId: adminUser.id,
      }
    })

    // Профиль Lomonosov School
    const lomonosovProfile = await db.clientProfile.create({
      data: {
        companyName: "Lomonosov School",
        industry: "Education & Online Learning",
        positioning: "Профессиональная онлайн-школа подготовки к ЕГЭ и ОГЭ, которая готовит с любого уровня на нужный балл без стресса и выгорания",
        targetAudience: JSON.stringify([
          "Школьники 9-11 классов готовящиеся к ЕГЭ/ОГЭ",
          "Родители ищущие качественную подготовку для детей",
          "Учащиеся желающие поступить в престижные ВУЗы",
          "Студенты нуждающиеся в дополнительной подготовке"
        ]),
        brandValues: JSON.stringify([
          "Качественное образование без стресса",
          "Профессионализм и экспертность преподавателей",
          "Индивидуальный подход к каждому ученику",
          "Доступность и выгодные цены",
          "Результативность и высокие баллы"
        ]),
        contentStrategy: "educational",
        toneOfVoice: "friendly",
        stylePreferences: JSON.stringify({
          videoStyle: "semi-professional",
          cameraWork: "stabilized",
          lighting: "enhanced", 
          colorPalette: "corporate",
          musicStyle: "ambient"
        }),
        mainProducts: JSON.stringify([
          "Годовые курсы ЕГЭ - полная подготовка за 9 месяцев",
          "Годовые курсы ОГЭ - подготовка к основному экзамену",
          "Интенсивы - краткосрочная подготовка",
          "Индивидуальные занятия - персональный подход"
        ]),
        competitiveAdvantages: JSON.stringify([
          "7 лет успешного опыта подготовки",
          "Преподаватели из МГУ и ведущих ВУЗов",
          "500+ стобальников за все время",
          "Средний балл 82 на ЕГЭ 2024",
          "Самая выгодная цена от 5.000₽/мес"
        ]),
        uniqueFeatures: JSON.stringify([
          "Подготовка без стресса и выгорания",
          "Увлекательная и интересная подача материала", 
          "Преподаватели на одной волне с учениками",
          "45к+ счастливых выпускников"
        ]),
        userId: adminUser.id,
      }
    })

    // Устанавливаем CrossFi как текущий профиль по умолчанию
    await db.user.update({
      where: { id: adminUser.id },
      data: { currentClientProfileId: crossfiProfile.id }
    })

    return NextResponse.json({
      message: 'Созданы профили клиентов',
      profiles: [
        { name: crossfiProfile.companyName, id: crossfiProfile.id },
        { name: lomonosovProfile.companyName, id: lomonosovProfile.id }
      ]
    })

  } catch (error) {
    console.error('Error seeding client profiles:', error)
    return NextResponse.json(
      { error: 'Ошибка создания профилей: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
