import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Получаем пользователя
    const adminUser = await db.user.findUnique({
      where: { username: 'LoreCore' }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 400 }
      )
    }

    // Находим профиль Lomonosov School
    const lomonosovProfile = await db.clientProfile.findFirst({
      where: { 
        companyName: 'Lomonosov School',
        userId: adminUser.id 
      }
    })

    if (!lomonosovProfile) {
      return NextResponse.json(
        { error: 'Профиль Lomonosov School не найден. Сначала создайте профили через /api/client-profiles/seed' },
        { status: 400 }
      )
    }

    // Удаляем существующие продукты для Lomonosov School
    await db.product.deleteMany({
      where: { clientProfileId: lomonosovProfile.id }
    })

    // Продукты Lomonosov School
    const lomonosovProducts = [
      {
        name: "Годовые курсы ЕГЭ",
        category: "Подготовка к ЕГЭ",
        description: "Полная подготовка к ЕГЭ за 9 месяцев с профессиональными преподавателями из МГУ. Увлекательная подготовка без стресса и выгорания.",
        key_features: [
          "9 месяцев интенсивной подготовки с экспертами",
          "Преподаватели из МГУ и ведущих ВУЗов России",
          "Индивидуальный подход к каждому ученику",
          "Подготовка без стресса и выгорания",
          "Гарантированное повышение баллов"
        ],
        consumer_benefits: [
          "Поступление в ВУЗ мечты с высокими баллами",
          "Экономия времени благодаря структурированной программе",
          "Уверенность в своих знаниях перед экзаменом",
          "Поддержка опытных наставников"
        ],
        target_users: [
          "Учащиеся 11 классов готовящиеся к ЕГЭ",
          "Абитуриенты нацеленные на высокие баллы",
          "Школьники желающие поступить в престижные ВУЗы"
        ],
        technical_specs: {
          duration: "9 месяцев",
          format: "Онлайн занятия",
          group_size: "До 15 человек",
          price: "От 5.000₽/месяц"
        }
      },
      {
        name: "Годовые курсы ОГЭ", 
        category: "Подготовка к ОГЭ",
        description: "Качественная подготовка к ОГЭ с преподавателями на одной волне с учениками. Весело и с максимальной пользой.",
        key_features: [
          "Подготовка с преподавателями на одной волне",
          "Интересная и увлекательная подача материала",
          "Проверенная методика за 7 лет работы",
          "Высокие результаты учеников",
          "Доступные цены для качественного образования"
        ],
        consumer_benefits: [
          "Успешная сдача ОГЭ без стресса",
          "Подготовка к поступлению в 10-11 класс",
          "Укрепление базовых знаний",
          "Повышение уверенности в предмете"
        ],
        target_users: [
          "Учащиеся 9 классов готовящиеся к ОГЭ",
          "Школьники планирующие продолжить обучение",
          "Родители ищущие качественную подготовку"
        ],
        technical_specs: {
          duration: "Учебный год",
          format: "Онлайн занятия",
          subjects: "Все предметы ОГЭ",
          price: "От 4.000₽/месяц"
        }
      },
      {
        name: "Интенсивы перед экзаменами",
        category: "Краткосрочная подготовка", 
        description: "Интенсивная подготовка к ЕГЭ/ОГЭ за короткий срок. Концентрированная программа для быстрого повышения баллов.",
        key_features: [
          "Концентрированная программа за 1-3 месяца",
          "Фокус на ключевые темы и задания",
          "Интенсивная практика решения задач",
          "Экспресс-методики запоминания",
          "Психологическая подготовка к экзамену"
        ],
        consumer_benefits: [
          "Быстрое повышение баллов за короткий срок",
          "Устранение пробелов в знаниях",
          "Уверенность на экзамене",
          "Оптимальное использование времени"
        ],
        target_users: [
          "Выпускники нуждающиеся в быстрой подготовке",
          "Учащиеся с базовыми знаниями",
          "Школьники готовящиеся к пересдаче"
        ],
        technical_specs: {
          duration: "1-3 месяца",
          intensity: "Высокая",
          format: "Онлайн + материалы",
          price: "От 15.000₽ за курс"
        }
      },
      {
        name: "Индивидуальные занятия",
        category: "Персональная подготовка",
        description: "Персональные занятия с лучшими преподавателями. Индивидуальная программа под конкретные цели и уровень ученика.",
        key_features: [
          "Персональная программа под ученика",
          "Гибкий график занятий",
          "Прямое общение с преподавателем",
          "Быстрая обратная связь и коррекция",
          "Максимальная эффективность обучения"
        ],
        consumer_benefits: [
          "100% внимания преподавателя",
          "Программа адаптированная под цели",
          "Быстрый прогресс в обучении",
          "Комфортный темп освоения материала"
        ],
        target_users: [
          "Ученики требующие индивидуального подхода",
          "Школьники с особыми потребностями в обучении",
          "Абитуриенты нацеленные на максимальные баллы"
        ],
        technical_specs: {
          format: "1-на-1 онлайн занятия",
          duration: "По потребности",
          flexibility: "Гибкий график",
          price: "От 2.000₽ за занятие"
        }
      }
    ]

    const createdProducts = []
    for (const productData of lomonosovProducts) {
      const product = await db.product.create({
        data: {
          name: productData.name,
          category: productData.category,
          description: productData.description,
          data: JSON.stringify(productData),
          archived: false,
          userId: adminUser.id,
          clientProfileId: lomonosovProfile.id,
        }
      })
      createdProducts.push(product)
    }

    return NextResponse.json({
      message: `Создано ${createdProducts.length} продуктов для Lomonosov School`,
      products: createdProducts
    })

  } catch (error) {
    console.error('Error seeding Lomonosov products:', error)
    return NextResponse.json(
      { error: 'Ошибка создания продуктов Lomonosov School: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
