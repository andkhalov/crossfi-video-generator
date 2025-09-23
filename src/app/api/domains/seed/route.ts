import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    // Читаем данные из domains_v6.json
    const domainsPath = path.join(process.cwd(), '../../domains_v6.json')
    
    let domainsData
    try {
      const fileContent = fs.readFileSync(domainsPath, 'utf-8')
      domainsData = JSON.parse(fileContent)
    } catch (error) {
      // Если файл не найден, используем демо данные
      domainsData = {
        domains: {
          "metamask_fox": {
            "title": "MetaMask Fox Adventures with CrossFi",
            "concept": "A charismatic, slightly flirtatious anthropomorphic fox girl who represents the MetaMask wallet discovers how perfectly CrossFi integrates with her Web3 lifestyle.",
            "locations": "Trendy crypto cafes with NFT art on walls, Web3 conferences with booth displays, high-tech shopping districts",
            "characters": "FIXED CHARACTER - NEVER RANDOMIZE: Anthropomorphic fox girl with bright orange fur, THREE purple streaks in her hair (left side), piercing emerald green eyes",
            "mood": "Playful tech-savvy energy, confident and slightly flirtatious, crypto-native enthusiasm",
            "shooting_features": "Vibrant saturated colors, slight anime/manga visual influence, vertical selfie-style with ring light",
            "sample_dialogues": [
              "Hey Web3 fam! Just connected MetaMask to CrossFi - seamless like my fur!",
              "From smart contracts to smart shopping - CrossFi gets it! *winks*"
            ],
            "length": [0.4, 0.4, 0.2],
            "rating": 9
          },
          "elite_tears": {
            "title": "The Elite's Dramatic Downfall",
            "concept": "Powerful politicians, oligarchs, and banking executives discover in horror that they can no longer control people's money through CrossFi.",
            "locations": "Mahogany-paneled boardrooms with city views, government offices with flags and portraits, private jets with leather seats",
            "characters": "RANDOMIZE EACH VIDEO from elite archetypes: 65-year-old banking CEO in $5000 suit with Rolex, 55-year-old senator with perfect hair",
            "mood": "Theatrical despair, dramatic irony, schadenfreude, dark comedy, panic among the powerful",
            "shooting_features": "Security camera angles with timestamp overlays, grainy leaked footage aesthetic, hidden camera quality",
            "sample_dialogues": [
              "We can't freeze their accounts anymore! It's all decentralized!",
              "Sir, they're not using our banks... they're using some kind of CrossFi thing!"
            ],
            "length": [0.6, 0.3, 0.1],
            "rating": 7
          }
        }
      }
    }

    // Создаем пользователя admin если его нет
    let adminUser = await db.user.findUnique({
      where: { username: 'LoreCore' }
    })

    if (!adminUser) {
      adminUser = await db.user.create({
        data: {
          id: 'admin',
          username: 'LoreCore',
          password: 'hashed_password',
        }
      })
    }

    // Удаляем существующие домены
    await db.domain.deleteMany()

    // Добавляем домены из файла
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
        }
      })
      createdDomains.push(domain)
    }

    return NextResponse.json({
      message: `Создано ${createdDomains.length} доменов`,
      domains: createdDomains
    })
  } catch (error) {
    console.error('Error seeding domains:', error)
    return NextResponse.json(
      { error: 'Ошибка инициализации доменов' },
      { status: 500 }
    )
  }
}
