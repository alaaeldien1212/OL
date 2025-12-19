import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { questions, answers, storyTitle, studentName, grade } = body

    console.log('Generate feedback request received:', { storyTitle, studentName, grade })

    const prompt = `أنت معلم لغة عربية تكتب تعليقاً تشجيعياً لطالب.

اسم الطالب: ${studentName}
القصة: ${storyTitle}
الدرجة: ${grade !== undefined && grade !== null ? `${grade}/100` : 'لم تحدد بعد'}

الأسئلة وإجابات الطالب:
${questions.map((q: any, i: number) => `
السؤال ${i + 1}: ${q.text_arabic}
الإجابة: ${answers[q.id] || 'لم يجب'}
`).join('\n')}

اكتب تعليقاً قصيراً (2-3 جمل) بالعربية يكون:
- مشجعاً وإيجابياً
- يذكر نقاط القوة في إجابات الطالب
- يقدم نصيحة بسيطة للتحسين إن وجدت
- مناسباً لطفل صغير

اكتب التعليق مباشرة بدون مقدمة:`

    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 200,
      top_p: 1,
      stream: false,
    })

    const feedback = chatCompletion.choices[0]?.message?.content?.trim() || 'أحسنت! استمر في القراءة والتعلم 🌟'

    console.log('Generated feedback:', feedback)

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error generating feedback:', error)
    return NextResponse.json(
      { feedback: 'أحسنت يا بطل! استمر في القراءة والتعلم 🌟' },
      { status: 200 }
    )
  }
}

