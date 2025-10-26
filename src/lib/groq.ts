import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: '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',
})

interface GradingRequest {
  questions: Array<{
    id: string
    text_arabic: string
    type: string
    required: boolean
  }>
  answers: Record<string, string>
  storyContent: string
  storyTitle: string
  difficulty: string
  gradeLevel: number
}

export async function autoGradeSubmission(request: GradingRequest) {
  try {
    // Build the prompt for grading
    const prompt = buildGradingPrompt(request)

    console.log('Sending grading request to Groq AI...')
    
    const chatCompletion = await groq.chat.completions.create({
      model: 'moonshotai/kimi-k2-instruct',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, lenient grading
      max_completion_tokens: 4096,
      top_p: 1,
      stream: false,
    })

    const response = chatCompletion.choices[0]?.message?.content || ''
    console.log('Groq AI response:', response)

    // Parse the response to extract grade and feedback
    const parsed = parseGradingResponse(response)
    
    return parsed
  } catch (error) {
    console.error('Error in auto-grading:', error)
    throw error
  }
}

// Helper function to detect nonsense/random answers
function isNonsenseAnswer(answer: string): boolean {
  if (!answer || answer.trim().length < 2) return true
  
  const trimmedAnswer = answer.trim()
  
  // Check for repeated characters (like "HHHH", "CCCC")
  const repeatedCharRegex = /^(\S)\1{3,}$/
  if (repeatedCharRegex.test(trimmedAnswer)) return true
  
  // Check for only English letters (without Arabic or meaningful content)
  const hasOnlyLatinChars = /^[a-zA-Z\s]+$/.test(trimmedAnswer)
  if (hasOnlyLatinChars && trimmedAnswer.length <= 5) return true
  
  // Check if answer is too short (less than 3 characters)
  if (trimmedAnswer.length < 3 && !/[\u0600-\u06FF]/.test(trimmedAnswer)) return true
  
  return false
}

function buildGradingPrompt(request: GradingRequest): string {
  const { questions, answers, storyContent, storyTitle, difficulty, gradeLevel } = request

  let prompt = `أنت معلم تقوم بتقييم إجابات طالب في الصف ${gradeLevel}.
القصة التي قرأها الطالب بعنوان: "${storyTitle}"

محتوى القصة:
${storyContent}

صعوبة القصة: ${difficulty}

الأسئلة وإجابات الطالب:

`

  let hasNonsenseAnswers = false
  questions.forEach(question => {
    const answer = answers[question.id] || 'لم يجب الطالب'
    const isNonsense = isNonsenseAnswer(answer)
    if (isNonsense) hasNonsenseAnswers = true
    
    prompt += `السؤال: ${question.text_arabic}
نوع السؤال: ${question.type}
الجواب: ${answer}
${isNonsense ? '⚠️ ملاحظة: هذه إجابة عشوائية/غير مكتملة' : ''}

`
  })

  if (hasNonsenseAnswers) {
    prompt += `
⚠️ **تنبيه مهم: بعض الإجابات عشوائية أو غير مكتملة (مثل أحرف متكررة أو كلمات عشوائية)**
    `
  }

    prompt += `
ملاحظة مهمة: هذه إجابات طفل صغير (صف ${gradeLevel}) يتعلم اللغة العربية، يجب أن تكون منصفاً ومشجعاً.

**معايير التقييم الصارمة:**

**للإجابات العشوائية/غير المكتملة (مثل "HHHH", "Chhh", أحرف عشوائية):**
- إذا كانت الإجابة عشوائية/لا معنى لها = 0-10
- إذا كانت الإجابة غير مكتملة أو أحرف فقط = 0-15

**للإجابات الحقيقية:**
- إجابة صحيحة كاملة = 90-100
- إجابة صحيحة بسيطة/قصيرة = 80-95  
- إجابة محاولة جيدة مع بعض الأخطاء = 70-85
- إجابة قصيرة جداً أو مبسطة لكن فيها محاولة = 60-80
- إجابة ضعيفة لكن تُظهر فهماً بسيطاً = 50-70

**قواعد صارمة:**
1. إذا كانت أكثر من نصف الإجابات عشوائية/لا معنى لها، يجب أن تكون الدرجة النهائية 0-20
2. إذا كانت بعض الإجابات عشوائية وبعضها محاولة حقيقية، قم بتقليل الدرجة الإجمالية بشكل كبير
3. لا تعطي أكثر من 30 درجة إذا كانت هناك إجابات عشوائية واضحة

يرجى إرجاع النتيجة بالتنسيق التالي:
GRADE: [رقم من 0-100 حسب جودة الإجابات]
FEEDBACK: [تعليق واضح بالعربية يوضح نقاط القوة والضعف]

مثال للإجابات العشوائية:
GRADE: 0
FEEDBACK: يبدو أنك لم تكمل الإجابات بشكل صحيح. يرجى المحاولة مرة أخرى وأجب على الأسئلة بجدية.

مثال للإجابات الجيدة:
GRADE: 85
FEEDBACK: ممتاز! لقد أظهرت فهماً جيداً للقصة. استمر في هذا الجهد! 🌟
`

  return prompt
}

function parseGradingResponse(response: string): { grade: number; feedback: string } {
  try {
    // Extract grade and feedback from response
    const gradeMatch = response.match(/GRADE:\s*(\d+)/i)
    const feedbackMatch = response.match(/FEEDBACK:\s*([^\n]+(?:\n[^\n]+)*)/i)

    const grade = gradeMatch ? parseInt(gradeMatch[1]) : 0 // Default to 0 if not found (strict default)
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'تم التقييم تلقائياً بواسطة الذكاء الاصطناعي'

    // Ensure grade is between 0-100
    return { grade: Math.min(100, Math.max(0, grade)), feedback }
  } catch (error) {
    console.error('Error parsing grading response:', error)
    return { grade: 0, feedback: 'حدث خطأ في التقييم، يرجى المحاولة مرة أخرى' }
  }
}

export default groq
