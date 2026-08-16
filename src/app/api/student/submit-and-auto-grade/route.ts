import { NextRequest, NextResponse } from 'next/server'
import { callAutoGradingGateway, AutoGradingGatewayError } from '@/lib/autoGradingGateway'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SubmissionRequest = {
  studentAccessCode: string
  storyId: string
  formTemplateId: string
  idempotencyKey: string
  answers: Record<string, string>
  audioUrl?: string
}

type StoredSubmission = {
  auto_graded?: number | null
  auto_feedback?: string | null
  auto_grading_metadata?: {
    needs_answer_key?: boolean
  } | null
  grade?: number | null
  feedback_arabic?: string | null
  status?: string | null
}

type PreparedStudentSubmission = {
  alreadySubmitted: boolean
  submission?: StoredSubmission
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_REQUEST_LENGTH = 100_000
const MAX_ANSWER_LENGTH = 8_000
const MAX_TOTAL_ANSWER_LENGTH = 40_000

function validateAudioUrl(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || value.length > 4_000) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!supabaseUrl) return null

  try {
    const audioUrl = new URL(value)
    const projectUrl = new URL(supabaseUrl)
    const expectedPrefix = '/storage/v1/object/public/student-recordings/voice-recordings/'
    if (audioUrl.protocol !== 'https:' || audioUrl.host !== projectUrl.host || !audioUrl.pathname.startsWith(expectedPrefix)) {
      return null
    }
    return audioUrl.toString()
  } catch {
    return null
  }
}

function parseSubmissionRequest(value: unknown): SubmissionRequest | null {
  if (!value || typeof value !== 'object') return null

  const body = value as Record<string, unknown>
  const studentAccessCode = typeof body.studentAccessCode === 'string' ? body.studentAccessCode.trim() : ''
  const storyId = typeof body.storyId === 'string' ? body.storyId.trim() : ''
  const formTemplateId = typeof body.formTemplateId === 'string' ? body.formTemplateId.trim() : ''
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : ''
  const audioUrl = validateAudioUrl(body.audioUrl)

  if (
    !studentAccessCode ||
    studentAccessCode.length > 64 ||
    !UUID_PATTERN.test(storyId) ||
    !UUID_PATTERN.test(formTemplateId) ||
    !UUID_PATTERN.test(idempotencyKey) ||
    audioUrl === null ||
    !body.answers ||
    typeof body.answers !== 'object' ||
    Array.isArray(body.answers)
  ) {
    return null
  }

  const answers: Record<string, string> = {}
  let totalLength = 0
  for (const [questionId, answer] of Object.entries(body.answers as Record<string, unknown>)) {
    if (!questionId || questionId.length > 200 || typeof answer !== 'string') return null
    const normalizedAnswer = answer.trim()
    totalLength += normalizedAnswer.length
    if (normalizedAnswer.length > MAX_ANSWER_LENGTH || totalLength > MAX_TOTAL_ANSWER_LENGTH) return null
    answers[questionId] = normalizedAnswer
  }

  return { studentAccessCode, storyId, formTemplateId, idempotencyKey, answers, audioUrl }
}

function gatewayErrorResponse(error: unknown) {
  if (error instanceof AutoGradingGatewayError) {
    if (error.status === 429) {
      return NextResponse.json({ error: 'تم تجاوز عدد محاولات التقييم. يرجى الانتظار قليلاً.' }, { status: 429 })
    }
    if (error.status >= 400 && error.status < 500) {
      return NextResponse.json({ error: 'تعذر التحقق من بيانات الطالب أو القصة' }, { status: error.status })
    }
  }
  console.error('Secure student submission failed:', error)
  return NextResponse.json({ error: 'تعذر حفظ الإجابات' }, { status: 500 })
}

function submissionResponse(submission: StoredSubmission, duplicate = false) {
  const needsAnswerKey = submission.auto_grading_metadata?.needs_answer_key === true
  const officialGrade = submission.grade ?? null
  return {
    autoGraded: officialGrade !== null && !needsAnswerKey,
    needsAnswerKey,
    grade: officialGrade,
    feedback: submission.feedback_arabic ?? submission.auto_feedback ?? null,
    submission,
    duplicate
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || '0')
  if (contentLength > MAX_REQUEST_LENGTH) {
    return NextResponse.json({ error: 'حجم الطلب كبير جداً' }, { status: 413 })
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'بيانات الطلب غير صالحة' }, { status: 400 })
  }
  if (rawBody.length > MAX_REQUEST_LENGTH) {
    return NextResponse.json({ error: 'حجم الطلب كبير جداً' }, { status: 413 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'بيانات الطلب غير صالحة' }, { status: 400 })
  }

  const submission = parseSubmissionRequest(body)
  if (!submission) {
    return NextResponse.json({ error: 'بيانات الإجابات غير صالحة' }, { status: 400 })
  }

  let prepared: PreparedStudentSubmission
  try {
    prepared = await callAutoGradingGateway<PreparedStudentSubmission>({
      action: 'prepare_student',
      ...submission
    })
  } catch (error) {
    return gatewayErrorResponse(error)
  }

  if (prepared.alreadySubmitted && prepared.submission) {
    return NextResponse.json(submissionResponse(prepared.submission, true))
  }

  try {
    const persisted = await callAutoGradingGateway<{ submission: StoredSubmission; duplicate: boolean }>({
      action: 'persist_student',
      ...submission
    })

    return NextResponse.json(
      submissionResponse(persisted.submission, persisted.duplicate),
      { status: persisted.duplicate ? 200 : 201 }
    )
  } catch (error) {
    return gatewayErrorResponse(error)
  }
}
