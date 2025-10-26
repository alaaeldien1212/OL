'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { gradingService, supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { 
  Star, 
  ArrowLeft, 
  CheckCircle,
  Clock,
  User,
  BookOpen,
  FileText,
  Save,
  Filter,
  Search
} from 'lucide-react'

interface Submission {
  id: string
  student_id: string
  student_name: string
  story_title: string
  form_title: string
  answers: any
  questions: any[]
  grade?: number
  feedback?: string
  submitted_at: string
  graded_at?: string
  audio_url?: string
  voice_grade?: number
}

export default function GradingPage() {
  const router = useRouter()
  const { user, userRole, isAuthenticated } = useAppStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [voiceGrade, setVoiceGrade] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'graded' | 'ungraded'>('all')

  useEffect(() => {
    console.log('Teacher Grading Page - User:', user)
    console.log('Teacher Grading Page - UserRole:', userRole)
    console.log('Teacher Grading Page - IsAuthenticated:', isAuthenticated)
    
    if (!isAuthenticated || userRole !== 'teacher') {
      if (typeof window !== 'undefined') {
        router.push('/')
      }
      return
    }
    
    loadSubmissions()
  }, [isAuthenticated, userRole, router])

  const loadSubmissions = async () => {
    try {
      setIsLoading(true)
      
      // Check if user is available
      if (!user || !('access_code' in user)) {
        console.error('User access code is not available')
        toast.error('خطأ في بيانات المستخدم')
        return
      }
      
      const accessCode = (user as any).access_code as string
      console.log('Loading submissions for teacher:', accessCode)
      
      // Use the new grading service
      const submissionsData = await gradingService.getTeacherSubmissions(accessCode)
      console.log('Loaded submissions:', submissionsData)

      const formattedSubmissions = submissionsData.map((sub: any) => ({
        id: sub.submission_id,
        student_id: sub.student_id,
        student_name: sub.student_name,
        story_title: sub.story_title,
        form_title: sub.form_title,
        answers: sub.responses,
        questions: sub.questions || [],
        grade: sub.grade,
        feedback: sub.feedback,
        submitted_at: sub.submitted_at,
        graded_at: sub.graded_at,
        audio_url: sub.audio_url,
        voice_grade: sub.voice_grade,
      }))

      setSubmissions(formattedSubmissions)
      console.log('Formatted submissions:', formattedSubmissions.length)
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('فشل تحميل الإجابات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return

    const gradeNum = parseInt(grade)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      toast.error('الرجاء إدخال درجة صحيحة (0-100)')
      return
    }

    // Parse voice grade if provided
    const voiceGradeNum = voiceGrade ? parseInt(voiceGrade) : undefined
    if (voiceGrade && (isNaN(voiceGradeNum!) || voiceGradeNum! < 0 || voiceGradeNum! > 100)) {
      toast.error('الرجاء إدخال درجة صوتية صحيحة (0-100)')
      return
    }

    try {
      setIsGrading(true)
      console.log('Starting to grade submission:', selectedSubmission.id, 'with grade:', gradeNum, 'voice grade:', voiceGradeNum)

      const result = await gradingService.gradeSubmission(selectedSubmission.id, gradeNum, feedback, voiceGradeNum)
      console.log('Grading completed successfully:', result)

      toast.success('تم تقييم الإجابة بنجاح! 🎉')
      
      // Update local state
      setSubmissions(submissions.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, grade: gradeNum, voice_grade: voiceGradeNum, feedback: feedback.trim(), graded_at: new Date().toISOString() }
          : sub
      ))

      setSelectedSubmission(null)
      setGrade('')
      setFeedback('')
      setVoiceGrade('')
      
      // Refresh submissions to get updated data
      setTimeout(() => {
        loadSubmissions()
      }, 1000)
      
    } catch (error) {
      console.error('Error grading submission:', error)
      toast.error('فشل تقييم الإجابة')
    } finally {
      setIsGrading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    switch (filter) {
      case 'graded':
        return sub.grade !== null
      case 'ungraded':
        return sub.grade === null
      default:
        return true
    }
  })

  return (
    <AnimatedBackground>
      <Toaster position="top-center" />
      <div className="w-full min-h-screen p-4 md:p-6" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Star className="w-10 h-10 text-yellow-400" />
                تقييم الإجابات
              </h1>
              <p className="text-gray-300 text-lg font-semibold">
                تقييم وتصحيح إجابات الطلاب
              </p>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Submissions List */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">قائمة الإجابات</h2>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'الكل' },
                      { value: 'ungraded', label: 'غير مقيمة' },
                      { value: 'graded', label: 'مقيمة' },
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        onClick={() => setFilter(value as any)}
                        variant={filter === value ? 'primary' : 'ghost'}
                        size="sm"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-spin">⏳</div>
                    <p className="text-xl text-gray-400">جاري التحميل...</p>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">لا توجد إجابات</h3>
                    <p className="text-gray-400">لم يتم إرسال أي إجابات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSubmissions.map((submission) => (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSubmission?.id === submission.id
                            ? 'border-primary bg-primary/10'
                            : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                        }`}
                        onClick={() => {
                          setSelectedSubmission(submission)
                          setGrade(submission.grade?.toString() || '')
                          setFeedback(submission.feedback || '')
                          setVoiceGrade(submission.voice_grade?.toString() || '')
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1">
                              {submission.student_name}
                            </h3>
                            <p className="text-gray-300 mb-2">
                              <BookOpen className="w-4 h-4 inline-block ml-1" />
                              {submission.story_title}
                            </p>
                            <p className="text-gray-400 text-sm">
                              <FileText className="w-4 h-4 inline-block ml-1" />
                              {submission.form_title}
                            </p>
                            {/* Voice Status */}
                            {submission.audio_url && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  🎤 تسجيل صوتي
                                </span>
                                {submission.voice_grade === null && submission.grade !== null && (
                                  <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 animate-pulse">
                                    ⏳ في انتظار تقييم الصوت
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-400">
                                {new Date(submission.submitted_at).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                            {submission.grade !== null ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-accent-green" />
                                <span className="text-lg font-bold text-accent-green">
                                  {submission.grade}/100
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-400" />
                                <span className="text-lg font-bold text-yellow-400">
                                  في الانتظار
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Grading Panel */}
            <div>
              {selectedSubmission ? (
                <Card>
                  <h3 className="text-xl font-bold text-white mb-4">تقييم الإجابة</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        الطالب
                      </label>
                      <p className="text-white font-bold">{selectedSubmission.student_name}</p>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        القصة
                      </label>
                      <p className="text-white">{selectedSubmission.story_title}</p>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        النموذج
                      </label>
                      <p className="text-white">{selectedSubmission.form_title}</p>
                    </div>

                    {/* Existing Grades Display */}
                    {(selectedSubmission.grade !== null || selectedSubmission.voice_grade !== null) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedSubmission.grade !== null && (
                          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg p-3 border border-blue-500/30">
                            <label className="block text-blue-300 font-semibold mb-1 text-xs">
                              تقييم النموذج
                            </label>
                            <p className="text-white font-bold text-lg">{selectedSubmission.grade}/100</p>
                          </div>
                        )}
                        {selectedSubmission.voice_grade !== null && (
                          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-lg p-3 border border-purple-500/30">
                            <label className="block text-purple-300 font-semibold mb-1 text-xs">
                              تقييم القراءة الصوتية
                            </label>
                            <p className="text-white font-bold text-lg">{selectedSubmission.voice_grade}/100</p>
                          </div>
                        )}
                        {selectedSubmission.grade !== null && selectedSubmission.voice_grade !== null && (
                          <div className="col-span-2 bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-lg p-3 border border-green-500/30 text-center">
                            <label className="block text-green-300 font-semibold mb-1 text-xs">
                              المعدل النهائي
                            </label>
                            <p className="text-white font-bold text-xl">
                              {Math.round((selectedSubmission.grade + selectedSubmission.voice_grade) / 2)}/100
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback Display */}
                    {selectedSubmission.feedback && (
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2">
                          التعليق
                        </label>
                        <div className="bg-slate-800 p-3 rounded-lg text-white text-sm">
                          {selectedSubmission.feedback}
                        </div>
                      </div>
                    )}

                    {/* Answers */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        الإجابات
                      </label>
                      <div className="bg-slate-900 p-4 rounded-lg max-h-60 overflow-y-auto">
                        {(() => {
                          // If we have questions array, use it
                          if (selectedSubmission.questions && Array.isArray(selectedSubmission.questions) && selectedSubmission.questions.length > 0) {
                            return selectedSubmission.questions.map((question: any, index: number) => {
                              const answer = selectedSubmission.answers[question.id]
                              
                              return (
                                <div key={question.id || index} className="mb-4 pb-4 border-b border-slate-700 last:border-b-0">
                                  <p className="text-sm font-bold text-primary mb-2">
                                    السؤال {index + 1}: {question.text_arabic}
                                  </p>
                                  <p className="text-white text-sm bg-slate-800 p-3 rounded-lg whitespace-pre-wrap">
                                    {answer || 'لم يجب الطالب'}
                                  </p>
                                </div>
                              )
                            })
                          }
                          
                          // Otherwise, iterate through answers and try to find matching questions
                          return Object.entries(selectedSubmission.answers).map(([answerKey, value], index) => {
                            // Try to find matching question
                            const question = selectedSubmission.questions?.find((q: any) => q.id === answerKey)
                            const questionText = question?.text_arabic || `السؤال ${index + 1}`
                            
                            return (
                              <div key={answerKey} className="mb-4 pb-4 border-b border-slate-700 last:border-b-0">
                                <p className="text-sm font-bold text-primary mb-2">
                                  {questionText}
                                </p>
                                <p className="text-white text-sm bg-slate-800 p-3 rounded-lg whitespace-pre-wrap">
                                  {value as string}
                                </p>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>

                    {/* Voice Recording */}
                    {selectedSubmission.audio_url && (
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2">
                          التسجيل الصوتي للقراءة 🎤
                        </label>
                        <div className="bg-slate-900 p-4 rounded-lg">
                          <audio controls className="w-full">
                            <source src={selectedSubmission.audio_url} type="audio/webm" />
                            متصفحك لا يدعم تشغيل الصوت
                          </audio>
                        </div>
                        
                        {/* Voice Grade Input */}
                        <div className="mt-4">
                          <label className="block text-gray-300 font-semibold mb-2">
                            تقييم القراءة الصوتية (0-100)
                          </label>
                          <input
                            type="number"
                            value={voiceGrade}
                            onChange={(e) => setVoiceGrade(e.target.value)}
                            min="0"
                            max="100"
                            className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                            disabled={isGrading}
                            placeholder="الدرجة (0-100)"
                          />
                        </div>
                      </div>
                    )}

                    {/* Grade Input */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        الدرجة (0-100)
                      </label>
                      <input
                        type="number"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                        disabled={isGrading}
                      />
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        التعليق (اختياري)
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={3}
                        placeholder="اكتب تعليقك هنا..."
                        className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold resize-none"
                        disabled={isGrading}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleGradeSubmission}
                        variant="primary"
                        size="md"
                        className="flex-1"
                        isLoading={isGrading}
                        disabled={isGrading}
                        icon={<Save className="w-4 h-4" />}
                      >
                        {isGrading ? 'جاري الحفظ...' : 'حفظ التقييم'}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedSubmission(null)
                          setGrade('')
                          setFeedback('')
                          setVoiceGrade('')
                        }}
                        variant="ghost"
                        size="md"
                        disabled={isGrading}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">اختر إجابة</h3>
                  <p className="text-gray-400">اختر إجابة من القائمة لتقييمها</p>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedBackground>
  )
}
