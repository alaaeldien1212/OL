'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import StoryQuestions from '@/components/student/StoryQuestions'
import { useAppStore } from '@/lib/store'
import { formsService, storiesService } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, Send, BookOpen } from 'lucide-react'

interface Question {
  id: string
  type: 'short_answer' | 'long_answer' | 'multiple_choice'
  required: boolean
  text_arabic: string
  options?: string[]
}

interface FormTemplate {
  id: string
  story_id: string
  title_arabic: string
  description_arabic: string
  questions: Question[]
  is_active: boolean
}

export default function StoryForm() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, hydrated } = useAppStore()
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoGrading, setIsAutoGrading] = useState(false)

  const storyId = params.id as string

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || !user) {
      router.push('/')
      return
    }

    loadFormTemplate()
  }, [hydrated, isAuthenticated, user, storyId, router])

  const loadFormTemplate = async () => {
    try {
      setIsLoading(true)
      console.log('Loading form template for story:', storyId)
      
      const studentData = user as any
      const studentAccessCode = studentData.access_code
      
      console.log('Student access code:', studentAccessCode)
      
      const formData = await formsService.getStudentFormTemplate(studentAccessCode, storyId)
      
      if (!formData) {
        console.log('No form template found for this story')
        toast.error('لا يوجد نموذج أسئلة لهذه القصة')
        router.push('/student')
        return
      }

      console.log('Loaded form template:', formData)
      setFormTemplate(formData)
      
      // Initialize answers object
      const initialAnswers: Record<string, string> = {}
      formData.questions.forEach((question: Question) => {
        initialAnswers[question.id] = ''
      })
      setAnswers(initialAnswers)
    } catch (error) {
      console.error('Failed to load form template:', error)
      toast.error('حدث خطأ في تحميل نموذج الأسئلة')
      router.push('/student')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const validateForm = () => {
    if (!formTemplate) return false
    
    for (const question of formTemplate.questions) {
      if (question.required && (!answers[question.id] || answers[question.id].trim() === '')) {
        toast.error(`يرجى الإجابة على السؤال: ${question.text_arabic}`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!formTemplate || !user) return

    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      setIsAutoGrading(true)
      toast.loading('جاري التقييم التلقائي للإجابات...', { id: 'auto-grading' })
      
      console.log('Submitting form answers:', answers)
      
      const studentData = user as any
      
      // Retrieve audio URL from localStorage if it exists
      const storageKey = `audio_recording_${storyId}`
      const audioUrl = localStorage.getItem(storageKey)
      
      // Fetch story details for auto-grading
      const studentAccessCode = studentData.access_code
      const story = await storiesService.getStudentSingleStory(studentAccessCode, storyId)
      
      if (!story) {
        toast.error('لا يمكن العثور على القصة', { id: 'auto-grading' })
        return
      }

      // Call auto-grading API
      let autoGrade = null
      let autoFeedback = null
      
      try {
        toast.loading('جاري تقييم الإجابات بالذكاء الاصطناعي...', { id: 'auto-grading' })
        
        const gradingResponse = await fetch('/api/auto-grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: formTemplate.questions,
            answers: answers,
            storyContent: story.content_arabic,
            storyTitle: story.title_arabic,
            difficulty: story.difficulty,
            gradeLevel: story.grade_level
          })
        })
        
        const gradingResult = await gradingResponse.json()
        autoGrade = gradingResult.grade
        autoFeedback = gradingResult.feedback
        
        console.log('Auto-grading result:', gradingResult)
        toast.success(`تم التقييم التلقائي! الدرجة: ${autoGrade}`, { id: 'auto-grading' })
      } catch (gradingError) {
        console.error('Auto-grading failed:', gradingError)
        toast.error('فشل التقييم التلقائي، سيتم إرسال الإجابة للمعلم', { id: 'auto-grading' })
      }
      
      // Submit the form with auto-grading results
      const submissionData = await formsService.submitForm(
        studentData.access_code,
        storyId,
        formTemplate.id,
        answers,
        audioUrl || undefined,
        autoGrade || undefined,
        autoFeedback || undefined
      )

      console.log('Form submitted successfully:', submissionData)
      
      // Clear the audio URL from localStorage after successful submission
      if (audioUrl) {
        localStorage.removeItem(storageKey)
      }
      
      toast.success('تم إرسال الإجابات بنجاح! 🎉')
      
      setTimeout(() => {
        router.push('/student')
      }, 2000)
    } catch (error) {
      console.error('Failed to submit form:', error)
      toast.error('حدث خطأ في إرسال الإجابات')
    } finally {
      setIsSubmitting(false)
      setIsAutoGrading(false)
      toast.dismiss('auto-grading')
    }
  }

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="w-full h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">📝</div>
            <p className="text-2xl font-bold text-white">جاري تحميل الأسئلة...</p>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  if (!formTemplate) {
    return (
      <AnimatedBackground>
        <div className="w-full h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-2xl font-bold text-white">لا يوجد نموذج أسئلة لهذه القصة</p>
            <Button onClick={() => router.push('/student')} className="mt-4">
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <AnimatedBackground>
      <Toaster position="top-center" />
      <div className="w-full min-h-screen p-3 md:p-6 pb-12 md:pb-6" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <StoryQuestions storyId={storyId} showBack onSubmitted={() => setTimeout(() => router.push('/student'), 1500)} />
        </motion.div>
      </div>
    </AnimatedBackground>
  )
}