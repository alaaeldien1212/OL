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

function buildGradingPrompt(request: GradingRequest): string {
  const { questions, answers, storyContent, storyTitle, difficulty, gradeLevel } = request

  let prompt = `أنت معلم تقوم بتقييم إجابات طالب في الصف ${gradeLevel}.
القصة التي قرأها الطالب بعنوان: "${storyTitle}"

محتوى القصة:
${storyContent}

صعوبة القصة: ${difficulty}

الأسئلة وإجابات الطالب:

`

  questions.forEach(question => {
    const answer = answers[question.id] || 'لم يجب الطالب'
    prompt += `السؤال: ${question.text_arabic}
نوع السؤال: ${question.type}
الجواب: ${answer}

`
  })

    prompt += `
ملاحظة مهمة: هذه إجابات طفل صغير (صف ${gradeLevel}) يتعلم اللغة العربية، يجب أن تكون منصفاً ومشجعاً.

يرجى تقييم إجابات الطالب وفق المعايير التالية (مع مراعاة سن الطفل ومستوى تعلمه):
1. **الجهد والمحاولة**: هل حاول الطفل الإجابة بجدية؟
2. **الفهم الأساسي**: هل فهم الفكرة العامة من القصة؟
3. **التفكير البسيط**: هل أظهر فهماً بسيطاً لدروس القصة؟
4. **حسن النية والمحاولة**: حتى لو كانت الإجابة بسيطة، كافئ الجهد

**تقييم متساهل ومشجع:**
- إجابة صحيحة كاملة = 90-100
- إجابة صحيحة بسيطة/قصيرة = 80-95  
- إجابة محاولة جيدة مع بعض الأخطاء = 70-85
- إجابة قصيرة جداً أو مبسطة = 60-80
- حتى الإجابات الضعيفة = 50-70 (إذا كانت تُظهر فهماً بسيطاً)

**العدالة والرفق:** تذكر أن الطفل يتعلم، لا تكن قاسياً، كن مشجعاً ومرحاً في التعليق.

يرجى إرجاع النتيجة بالتنسيق التالي:
GRADE: [رقم من 50-100]
FEEDBACK: [تعليق مشجع ومحفز بالعربية، أظهر الفخر بجهد الطفل]

مثال:
GRADE: 95
FEEDBACK: ممتاز! لقد أظهرت فهماً رائعاً للقصة وتجتهد كثيراً. استمر في هذا الجهد الرائع! 🌟
`

  return prompt
}

function parseGradingResponse(response: string): { grade: number; feedback: string } {
  try {
    // Extract grade and feedback from response
    const gradeMatch = response.match(/GRADE:\s*(\d+)/i)
    const feedbackMatch = response.match(/FEEDBACK:\s*([^\n]+(?:\n[^\n]+)*)/i)

    const grade = gradeMatch ? parseInt(gradeMatch[1]) : 85 // Default to 85 if not found (encouraging default)
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'تم التقييم تلقائياً بواسطة الذكاء الاصطناعي'

    // Ensure grade is between 50-100 for encouraging grading
    return { grade: Math.min(100, Math.max(50, grade)), feedback }
  } catch (error) {
    console.error('Error parsing grading response:', error)
    return { grade: 85, feedback: 'تم التقييم تلقائياً بواسطة الذكاء الاصطناعي' }
  }
}

export default groq
