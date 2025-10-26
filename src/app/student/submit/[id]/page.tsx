'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
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
  const { user, isAuthenticated } = useAppStore()
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoGrading, setIsAutoGrading] = useState(false)

  const storyId = params.id as string

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/')
      return
    }

    loadFormTemplate()
  }, [isAuthenticated, user, storyId, router])

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
            <p className="text-2xl font-bold text-ink">جاري تحميل الأسئلة...</p>
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
            <p className="text-2xl font-bold text-ink">لا يوجد نموذج أسئلة لهذه القصة</p>
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
      <div className="w-full min-h-screen p-4 md:p-6" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-ink flex items-center gap-3">
                <BookOpen className="w-10 h-10 text-accent-green" />
                {formTemplate.title_arabic}
              </h1>
              <p className="text-gray-600 text-lg mt-2">{formTemplate.description_arabic}</p>
            </div>
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="md"
              icon={<ArrowLeft className="w-5 h-5" />}
            >
              العودة
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {formTemplate.questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card elevation="sm" padding="lg">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-ink mb-2">
                      السؤال {index + 1}
                      {question.required && <span className="text-accent-red mr-2">*</span>}
                    </h3>
                    <p className="text-lg text-gray-700 mb-4">{question.text_arabic}</p>
                  </div>

                  {question.type === 'short_answer' && (
                    <input
                      type="text"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="اكتب إجابتك هنا..."
                      className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-white text-gray-800"
                      disabled={isSubmitting}
                    />
                  )}

                  {question.type === 'long_answer' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="اكتب إجابتك المفصلة هنا..."
                      rows={6}
                      className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-white text-gray-800 resize-none"
                      disabled={isSubmitting}
                    />
                  )}

                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-5 h-5 text-primary"
                            disabled={isSubmitting}
                          />
                          <span className="text-lg text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex justify-center"
          >
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              icon={<Send className="w-5 h-5" />}
              className="px-8"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الإجابات'}
            </Button>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            <Card elevation="sm" padding="md">
              <div className="text-center">
                <p className="text-gray-600 mb-2">تقدم الإجابة</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: `${(Object.values(answers).filter(answer => answer.trim() !== '').length / formTemplate.questions.length) * 100}%` 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {Object.values(answers).filter(answer => answer.trim() !== '').length} من {formTemplate.questions.length} أسئلة
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedBackground>
  )
}