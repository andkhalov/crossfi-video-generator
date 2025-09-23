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
        { error: 'Профиль Lomonosov School не найден' },
        { status: 400 }
      )
    }

    // Удаляем существующие домены для Lomonosov School
    await db.domain.deleteMany({
      where: { clientProfileId: lomonosovProfile.id }
    })

    // Домены для Lomonosov School
    const lomonosovDomains = {
      "teacher_testimonials": {
        "title": "Testimonials from Teachers",
        "concept": "Professional teachers from top universities (MGU, MIPT, etc.) share their teaching philosophy and approach. Semi-professional video style with educational focus, showing expertise and warmth. Teachers speak directly to camera in comfortable academic environment.",
        "locations": "Home study/office, university classroom, library, cozy teaching space with books and academic materials",
        "characters": "Professional teachers 25-45 years old, academic background, warm and approachable, wearing smart casual or business casual, confident but not arrogant",
        "mood": "Professional yet warm, educational, inspiring, trustworthy, motivational, expert guidance",
        "shooting_features": "Semi-professional lighting, stable camera work, clean background, good audio quality, academic atmosphere",
        "sample_dialogues": [
          "Я помогу тебе разобраться с самыми сложными темами",
          "Главное - это понимание, а не зубрежка",
          "Вместе мы достигнем твоего целевого балла"
        ],
        "length": [0.4, 0.5, 0.1],
        "rating": 8
      },
      "student_success_stories": {
        "title": "Student Success Stories",
        "concept": "Real students sharing their success stories and high scores achieved with Lomonosov School. Authentic testimonials showing genuine emotions and results. Semi-amateur style to maintain authenticity while being polished enough for marketing.",
        "locations": "Student room, home environment, university campus, celebration moments, study spaces",
        "characters": "Students 16-19 years old, diverse backgrounds, genuine emotions, casual clothing, holding certificates or showing scores on phone/computer",
        "mood": "Excited, grateful, accomplished, authentic joy, relief, pride, motivational",
        "shooting_features": "Natural lighting, handheld or selfie style, authentic reactions, screen recordings of results, celebration moments",
        "sample_dialogues": [
          "Я не верил что смогу получить 90+ баллов!",
          "Lomonosov School изменила мой подход к учебе",
          "Теперь я поступаю в ВУЗ мечты!"
        ],
        "length": [0.6, 0.3, 0.1],
        "rating": 9
      },
      "study_process_behind_scenes": {
        "title": "Study Process Behind the Scenes",
        "concept": "Behind-the-scenes look at how online lessons work, showing the technology, interaction, and learning process. Educational style focusing on methodology and approach. Shows both teacher and student perspectives during actual lessons.",
        "locations": "Online classroom interface, teacher's home office, student's study space, computer screens, learning materials",
        "characters": "Teachers conducting lessons, students actively participating, parents observing, IT support, diverse age groups",
        "mood": "Educational, engaging, technological, modern, interactive, professional learning environment",
        "shooting_features": "Screen recordings, picture-in-picture, clean interface shots, good lighting for faces, clear audio",
        "sample_dialogues": [
          "Смотрите как легко разобрать эту задачу",
          "У кого есть вопросы по этой теме?",
          "Отличная работа! Видите как просто?"
        ],
        "length": [0.3, 0.6, 0.1],
        "rating": 7
      },
      "exam_preparation_tips": {
        "title": "Exam Preparation Tips",
        "concept": "Quick educational tips and life hacks for exam preparation. Teachers share proven strategies, study techniques, and stress management. Educational content that provides immediate value while showcasing expertise.",
        "locations": "Teacher's study, classroom, library, comfortable educational environment with academic materials",
        "characters": "Expert teachers, educational consultants, psychologists, academic advisors, experienced tutors",
        "mood": "Helpful, expert, confident, supportive, educational, practical, solution-oriented",
        "shooting_features": "Clean educational style, good lighting, clear presentation, visual aids, professional but approachable",
        "sample_dialogues": [
          "Этот лайфхак поможет запомнить формулы",
          "Главное правило подготовки к экзамену",
          "Так делают все стобальники"
        ],
        "length": [0.7, 0.2, 0.1],
        "rating": 8
      }
    }

    const createdDomains = []
    for (const [key, domainData] of Object.entries(lomonosovDomains)) {
      const domain = await db.domain.create({
        data: {
          key,
          title: domainData.title,
          concept: domainData.concept,
          data: JSON.stringify(domainData),
          archived: false,
          userId: adminUser.id,
          clientProfileId: lomonosovProfile.id,
        }
      })
      createdDomains.push(domain)
    }

    return NextResponse.json({
      message: `Создано ${createdDomains.length} доменов для Lomonosov School`,
      domains: createdDomains
    })

  } catch (error) {
    console.error('Error seeding Lomonosov domains:', error)
    return NextResponse.json(
      { error: 'Ошибка создания доменов Lomonosov School: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
