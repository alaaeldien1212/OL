export const MISSING_ANSWER_KEY_MESSAGE =
  'هذا النموذج يحتاج إلى إضافة الإجابة الصحيحة قبل إمكانية التصحيح الآلي.'

export const FORM_REQUIRES_ANSWER_KEYS_MESSAGE =
  'لا يمكن حفظ النموذج قبل إضافة إجابة صحيحة لكل سؤال.'

export type GradableQuestion = {
  id: string
  text_arabic?: string
  type: string
  required?: boolean
  options?: string[]
  correct_answer?: string | null
}

export type QuestionScore = {
  questionId: string
  correct: boolean
  score: number
}

export type AnswerKeyGradingResult =
  | {
      ok: true
      grade: number
      feedback: string
      questionScores: QuestionScore[]
      correctCount: number
      totalQuestions: number
    }
  | {
      ok: false
      reason: 'missing_answer_key'
      missingQuestionIds: string[]
      message: string
    }

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeArabicAnswer(value: string): string {
  return asTrimmedString(value)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ar')
}

export function parseAcceptableAnswers(correctAnswer: string): string[] {
  return correctAnswer
    .split('|')
    .map(part => asTrimmedString(part))
    .filter(Boolean)
}

export function questionHasAnswerKey(question: GradableQuestion): boolean {
  const correctAnswer = asTrimmedString(question.correct_answer)
  if (!correctAnswer) return false

  if (question.type === 'multiple_choice') {
    const options = (question.options || []).map(option => asTrimmedString(option)).filter(Boolean)
    return options.includes(correctAnswer)
  }

  return parseAcceptableAnswers(correctAnswer).length > 0
}

export function questionsMissingAnswerKeys(questions: GradableQuestion[]): GradableQuestion[] {
  return questions.filter(question => !questionHasAnswerKey(question))
}

export function assertFormQuestionsHaveAnswerKeys(questions: GradableQuestion[]): void {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('الرجاء إضافة سؤال واحد على الأقل مع إجابته الصحيحة')
  }

  const missing = questionsMissingAnswerKeys(questions)
  if (missing.length > 0) {
    throw new Error(FORM_REQUIRES_ANSWER_KEYS_MESSAGE)
  }
}

export function answersMatch(studentAnswer: string, correctAnswer: string, type: string): boolean {
  const submitted = asTrimmedString(studentAnswer)
  if (!submitted) return false

  if (type === 'multiple_choice') {
    return submitted === asTrimmedString(correctAnswer)
  }

  const normalizedSubmitted = normalizeArabicAnswer(submitted)
  return parseAcceptableAnswers(correctAnswer).some(
    acceptable => normalizeArabicAnswer(acceptable) === normalizedSubmitted
  )
}

function buildFeedback(correctCount: number, totalQuestions: number, grade: number): string {
  if (grade === 100) {
    return `تم التصحيح تلقائيًا. أحسنت، جميع الإجابات صحيحة (${correctCount} من ${totalQuestions}).`
  }
  if (correctCount === 0) {
    return `تم التصحيح تلقائيًا. لم تُحتسب أي إجابة صحيحة من أصل ${totalQuestions} أسئلة. راجعي القصة ثم حاولي مرة أخرى في المهام القادمة.`
  }
  return `تم التصحيح تلقائيًا. عدد الإجابات الصحيحة ${correctCount} من ${totalQuestions}، والدرجة ${grade} من 100.`
}

export function gradeAgainstAnswerKey(
  questions: GradableQuestion[],
  answers: Record<string, string>
): AnswerKeyGradingResult {
  if (!Array.isArray(questions) || questions.length === 0) {
    return {
      ok: false,
      reason: 'missing_answer_key',
      missingQuestionIds: [],
      message: MISSING_ANSWER_KEY_MESSAGE
    }
  }

  const missing = questionsMissingAnswerKeys(questions)
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'missing_answer_key',
      missingQuestionIds: missing.map(question => question.id),
      message: MISSING_ANSWER_KEY_MESSAGE
    }
  }

  const questionScores = questions.map(question => {
    const correct = answersMatch(answers[question.id] || '', String(question.correct_answer), question.type)
    return {
      questionId: question.id,
      correct,
      score: correct ? 100 : 0
    }
  })

  const correctCount = questionScores.filter(item => item.correct).length
  const grade = Math.round((correctCount / questions.length) * 100)

  return {
    ok: true,
    grade,
    feedback: buildFeedback(correctCount, questions.length, grade),
    questionScores,
    correctCount,
    totalQuestions: questions.length
  }
}

export function stripQuestionAnswerKeys<T extends Record<string, unknown>>(questions: T[]): T[] {
  return questions.map(question => {
    const safeQuestion = { ...question }
    delete safeQuestion.correct_answer
    return safeQuestion
  })
}
