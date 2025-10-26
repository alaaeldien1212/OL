import { NextRequest, NextResponse } from 'next/server'
import { autoGradeSubmission } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { questions, answers, storyContent, storyTitle, difficulty, gradeLevel } = body

    console.log('Auto-grading request received:', { storyTitle, difficulty, gradeLevel })

    const result = await autoGradeSubmission({
      questions,
      answers,
      storyContent,
      storyTitle,
      difficulty,
      gradeLevel
    })

    console.log('Auto-grading completed:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in auto-grading API:', error)
    return NextResponse.json(
      { error: 'Failed to auto-grade submission', grade: 75, feedback: 'حدث خطأ في التقييم التلقائي' },
      { status: 500 }
    )
  }
}

