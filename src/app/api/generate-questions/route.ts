import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface GenerateQuestionsRequest {
  storyContent: string
  storyTitle: string
  difficulty: string
  gradeLevel: number
}

export async function POST(req: Request) {
  try {
    const { storyContent, storyTitle, difficulty, gradeLevel } = await req.json()

    console.log('Generating questions for:', storyTitle)

    if (!storyContent || !storyTitle || !difficulty || !gradeLevel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Build the prompt for generating questions
    const prompt = `
أنت معلم خبير في الصف ${gradeLevel} الابتدائي. 
المهمة: إنشاء نموذج أسئلة مناسبة للأطفال في الصف ${gradeLevel} باللغة العربية.

القصة:
العنوان: ${storyTitle}
المحتوى: ${storyContent}
مستوى الصعوبة: ${difficulty}

يرجى إنشاء ${difficulty === 'easy' ? '3' : difficulty === 'medium' ? '4' : '5'} أسئلة تتناسب مع مستوى الصف ${gradeLevel} ومستوى الصعوبة ${difficulty}.

أنواع الأسئلة المطلوبة:
1. سؤال فهم مباشر (ما هو اسم البطل؟ / ماذا حدث في القصة؟)
2. سؤال التفكير البسيط (لماذا فعل البطل هذا؟ / ما هي الرسالة من القصة؟)
3. سؤال مفتوح بسيط (ماذا كان شعورك عند قراءة القصة؟ / هل تحب نهاية القصة؟)
${difficulty !== 'easy' ? '4. سؤال التحليل البسيط (ما هي الفكرة الرئيسية؟)\n' : ''}
${difficulty === 'hard' ? '5. سؤال التفكير النقدي (كيف يمكن تطبيق درس القصة في الحياة؟)\n' : ''}

يجب أن تكون الأسئلة:
- بسيطة ومناسبة لعمر ${gradeLevel} سنوات
- واضحة ومفهومة
- مرتبطة بمحتوى القصة
- مشجعة ومحفزة للتفكير

يرجى إرجاع الأسئلة بالتنسيق التالي (لكل سؤال):
ID: [معرف فريد]
TEXT: [نص السؤال بالعربية]
TYPE: [multiple_choice / short_answer / long_answer]
REQUIRED: true

إذا كان السؤال multiple_choice، أضف:
OPTIONS: [خيار1، خيار2، خيار3، خيار4]

مثال:
ID: q1_rjla_al_amal
TEXT: ما هو اسم البطل في القصة؟
TYPE: short_answer
REQUIRED: true

ID: q2_rjla_al_amal
TEXT: ما هي الفكرة الرئيسية من القصة؟
TYPE: long_answer
REQUIRED: true

يرجى إرجاع الأسئلة فقط بدون أي تعليقات إضافية.
`

    const chatCompletion = await groq.chat.completions.create({
      model: 'moonshotai/kimi-k2-instruct',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 4096,
      top_p: 1,
      stream: false,
    })

    const response = chatCompletion.choices[0]?.message?.content || ''
    console.log('Generated questions:', response)

    // Parse the response to extract questions
    const questions = parseQuestions(response)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}

function parseQuestions(text: string) {
  const questions: any[] = []
  const lines = text.split('\n')

  let currentQuestion: any = null

  for (const line of lines) {
    if (line.trim() === '') continue

    if (line.startsWith('ID:')) {
      if (currentQuestion) {
        questions.push(currentQuestion)
      }
      currentQuestion = {
        id: line.replace('ID:', '').trim(),
        text_arabic: '',
        type: 'short_answer',
        required: true,
        options: []
      }
    } else if (line.startsWith('TEXT:') && currentQuestion) {
      currentQuestion.text_arabic = line.replace('TEXT:', '').trim()
    } else if (line.startsWith('TYPE:') && currentQuestion) {
      currentQuestion.type = line.replace('TYPE:', '').trim() as 'multiple_choice' | 'short_answer' | 'long_answer'
    } else if (line.startsWith('REQUIRED:') && currentQuestion) {
      currentQuestion.required = line.replace('REQUIRED:', '').trim().toLowerCase() === 'true'
    } else if (line.startsWith('OPTIONS:') && currentQuestion) {
      const optionsStr = line.replace('OPTIONS:', '').trim()
      currentQuestion.options = optionsStr.split('،').map((opt: string) => opt.trim())
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion)
  }

  return questions
}

