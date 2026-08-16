'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import LoadingState from '@/components/LoadingState'
import { useAppStore } from '@/lib/store'
import { gradingService, supabase } from '@/lib/supabase'
import { getTrustedStudentRecordingUrl, inferAudioMimeFromUrl } from '@/lib/utils'
import { MISSING_ANSWER_KEY_MESSAGE } from '@/lib/answerKeyGrading'
import toast, { Toaster } from 'react-hot-toast'
import { 
  Star, 
  ArrowRight,
  CheckCircle,
  Clock,
  User,
  BookOpen,
  FileText
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
  auto_graded?: number
  auto_feedback?: string
  feedback?: string
  submitted_at: string
  graded_at?: string
  audio_url?: string
  voice_grade?: number
  needs_answer_key?: boolean
}

interface Student {
  id: string
  name: string
}

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, userRole, isAuthenticated, hydrated } = useAppStore()
  const [studentId, setStudentId] = useState<string>('')
  const [student, setStudent] = useState<Student | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [filter, setFilter] = useState<'all' | 'graded' | 'ungraded'>('all')

  useEffect(() => {
    if (!hydrated) return
    // Extract studentId from params immediately
    const id = params?.id as string
    if (id) {
      setStudentId(id)
    }
  }, [params])

  useEffect(() => {
    // Wait for client-side before doing anything
    if (typeof window === 'undefined') {
      return
    }

    console.log('Student Detail Page - User:', user)
    console.log('Student Detail Page - UserRole:', userRole)
    console.log('Student Detail Page - IsAuthenticated:', isAuthenticated)
    console.log('Student Detail Page - StudentId:', studentId)
    console.log('Student Detail Page - Params:', params)
    
    // Don't proceed if we're still waiting for studentId
    if (!studentId) {
      console.log('Waiting for studentId from params...')
      return
    }
    
    // Only check auth if we have the studentId - this prevents premature redirects
    // that happen before zustand persist has hydrated
    if (studentId && isAuthenticated && userRole === 'teacher') {
      console.log('All checks passed, loading submissions...')
      loadStudentAndSubmissions()
    } else if (studentId && (isAuthenticated === false || userRole !== 'teacher')) {
      // Only redirect if we're sure the user is not authenticated (not just waiting for hydration)
      // Check the actual store state to avoid hydration race conditions
      const storeState = useAppStore.getState()
      console.log('Checking store state directly:', { 
        isAuthenticated: storeState.isAuthenticated, 
        userRole: storeState.userRole,
        hasUser: !!storeState.user 
      })
      
      if (storeState.isAuthenticated === false || storeState.userRole !== 'teacher') {
        console.log('Auth check failed after verification, redirecting...')
        router.push('/')
      }
    }
    // If we have studentId but auth state is still null/undefined, we wait (hydration in progress)
  }, [hydrated, isAuthenticated, userRole, router, studentId, user, params])

  const loadStudentAndSubmissions = async () => {
    try {
      setIsLoading(true)
      
      // Check if user is available
      if (!user || !('access_code' in user)) {
        console.error('User access code is not available')
        toast.error('خطأ في بيانات المستخدم')
        return
      }

      const accessCode = (user as any).access_code as string
      
      // Load student info
      const { data: studentsData, error: studentsError } = await supabase.rpc('teacher_get_students', {
        teacher_access_code: accessCode
      })

      if (studentsError) {
        console.error('Error loading student:', studentsError)
        toast.error('فشل تحميل بيانات الطالب')
        return
      }

      const foundStudent = studentsData?.find((s: any) => s.id === studentId)
      if (!foundStudent) {
        toast.error('الطالب غير موجود')
        router.push('/teacher/students')
        return
      }

      setStudent({ id: foundStudent.id, name: foundStudent.name })
      
      // Load all submissions for the teacher
      const submissionsData = await gradingService.getTeacherSubmissions(accessCode)
      console.log('Loaded submissions:', submissionsData)

      // Filter submissions for this specific student
      const filteredSubmissions = submissionsData
        .filter((sub: any) => sub.student_id === studentId)
        .map((sub: any) => ({
          id: sub.submission_id,
          student_id: sub.student_id,
          student_name: sub.student_name,
          story_title: sub.story_title,
          form_title: sub.form_title,
          answers: sub.responses,
          questions: sub.questions || [],
          grade: sub.grade,
          auto_graded: sub.auto_graded,
          auto_feedback: sub.auto_feedback,
          feedback: sub.feedback,
          submitted_at: sub.submitted_at,
          graded_at: sub.graded_at,
          audio_url: getTrustedStudentRecordingUrl(sub.audio_url),
          voice_grade: sub.voice_grade,
          needs_answer_key: sub.needs_answer_key === true,
        }))

      setSubmissions(filteredSubmissions)
      console.log('Filtered submissions for student:', filteredSubmissions.length)
    } catch (error) {
      console.error('Error loading student and submissions:', error)
      toast.error('فشل تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    switch (filter) {
      case 'graded':
        return sub.grade !== null && sub.grade !== undefined
      case 'ungraded':
        return sub.grade === null || sub.grade === undefined
      default:
        return true
    }
  })

  return (
    <AnimatedBackground>
      <Toaster position="top-center" />
      <div className="page-container min-h-screen" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-ink mb-2 flex items-center gap-3">
                <User className="w-6 h-6 md:w-10 md:h-10 text-primary-700" />
                {student ? `${student.name} - نتائج الإجابات` : 'نتائج الإجابات'}
              </h1>
              <p className="text-slate-600 text-sm md:text-lg font-semibold">
                عرض إجابات الطالب والدرجات التلقائية
              </p>
            </div>
            <Button
              onClick={() => router.push('/teacher/students')}
              variant="ghost"
              size="sm"
              icon={<ArrowRight className="w-4 h-4 md:w-5 md:h-5" />}
              className="w-full md:w-auto"
            >
              العودة
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Submissions List */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-ink">قائمة الإجابات</h2>
                  <div className="flex gap-2 w-full md:w-auto">
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
                        className="flex-1 md:flex-none"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {isLoading ? (
                  <LoadingState />
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-ink mb-2">لا توجد إجابات</h3>
                    <p className="text-slate-500">لم يرسل الطالب أي إجابات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSubmissions.map((submission) => (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-[border-color,background-color,box-shadow] ${
                          selectedSubmission?.id === submission.id
                            ? 'border-primary bg-primary/10'
                            : 'border-slate-200 bg-white hover:bg-white'
                        }`}
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-600 mb-2 text-sm md:text-base">
                              <BookOpen className="w-3 h-3 md:w-4 md:h-4 inline-block ms-1" />
                              <span className="truncate block">{submission.story_title}</span>
                            </p>
                            <p className="text-slate-500 text-xs md:text-sm">
                              <FileText className="w-3 h-3 md:w-4 md:h-4 inline-block ms-1" />
                              <span className="truncate block">{submission.form_title}</span>
                            </p>
                            {/* Voice Status */}
                            {submission.audio_url && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs px-2 py-1 rounded-lg bg-secondary-50 text-secondary-700 border border-secondary-200/30">
                                   تسجيل صوتي
                                </span>
                              </div>
                            )}
                            {submission.needs_answer_key && (
                              <div className="mt-2">
                                <span className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/30">
                                  يحتاج مفتاح إجابة
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-end">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span className="text-sm text-slate-500">
                                {new Date(submission.submitted_at).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                        {(submission.grade) !== null && (submission.grade) !== undefined ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-accent-green" />
                                <span className="text-lg font-bold text-accent-green">
                              {submission.grade}/100
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-700" />
                                <span className="text-lg font-bold text-amber-700">
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
                  <h3 className="text-lg md:text-xl font-bold text-ink mb-4">تفاصيل الإجابة</h3>
                  
                  <div className="space-y-4">
                    {selectedSubmission.needs_answer_key && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                        {MISSING_ANSWER_KEY_MESSAGE}
                      </div>
                    )}
                    <div>
                      <label className="block text-slate-600 font-semibold mb-2">
                        القصة
                      </label>
                      <p className="text-ink">{selectedSubmission.story_title}</p>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-2">
                        النموذج
                      </label>
                      <p className="text-ink">{selectedSubmission.form_title}</p>
                    </div>

                    {/* Existing Grades Display */}
                    {(selectedSubmission.grade !== null || selectedSubmission.voice_grade !== null) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedSubmission.grade !== null && selectedSubmission.grade !== undefined && (
                          <div className="bg-white   rounded-lg p-2 md:p-3 border border-primary-200/30">
                            <label className="block text-primary-700 font-semibold mb-1 text-xs">
                              تقييم النموذج
                            </label>
                            <p className="text-ink font-bold text-base md:text-lg">{selectedSubmission.grade}/100</p>
                          </div>
                        )}
                        {selectedSubmission.voice_grade !== null && selectedSubmission.voice_grade !== undefined && (
                          <div className="bg-white   rounded-lg p-2 md:p-3 border border-secondary-200/30">
                            <label className="block text-secondary-700 font-semibold mb-1 text-xs">
                              تقييم القراءة الصوتية
                            </label>
                            <p className="text-ink font-bold text-base md:text-lg">{selectedSubmission.voice_grade}/100</p>
                          </div>
                        )}
                        {selectedSubmission.grade !== null && selectedSubmission.grade !== undefined &&
                         selectedSubmission.voice_grade !== null && selectedSubmission.voice_grade !== undefined && (
                          <div className="col-span-2 bg-white   rounded-lg p-2 md:p-3 border border-emerald-200/30 text-center">
                            <label className="block text-emerald-700 font-semibold mb-1 text-xs">
                              المعدل النهائي
                            </label>
                            <p className="text-ink font-bold text-lg md:text-xl">
                              {Math.round(((selectedSubmission.grade + selectedSubmission.voice_grade) / 2))}/100
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback Display */}
                    {selectedSubmission.feedback || selectedSubmission.auto_feedback ? (
                      <div>
                        <label className="block text-slate-600 font-semibold mb-2">
                          التعليق
                        </label>
                        <div className="bg-white p-3 rounded-lg text-ink text-sm">
                          {selectedSubmission.feedback || selectedSubmission.auto_feedback}
                        </div>
                      </div>
                    ) : null}

                    {/* Answers */}
                    <div>
                      <label className="block text-slate-600 font-semibold mb-2">
                        الإجابات
                      </label>
                      <div className="bg-white p-4 rounded-lg max-h-60 overflow-y-auto">
                        {(() => {
                          // If we have questions array, use it
                          if (selectedSubmission.questions && Array.isArray(selectedSubmission.questions) && selectedSubmission.questions.length > 0) {
                            return selectedSubmission.questions.map((question: any, index: number) => {
                              const answer = selectedSubmission.answers[question.id]
                              
                              return (
                                <div key={question.id || index} className="mb-4 pb-4 border-b border-slate-200 last:border-b-0">
                                  <p className="text-sm font-bold text-primary mb-2">
                                    السؤال {index + 1}: {question.text_arabic}
                                  </p>
                                  <p className="text-ink text-sm bg-white p-3 rounded-lg whitespace-pre-wrap">
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
                              <div key={answerKey} className="mb-4 pb-4 border-b border-slate-200 last:border-b-0">
                                <p className="text-sm font-bold text-primary mb-2">
                                  {questionText}
                                </p>
                                <p className="text-ink text-sm bg-white p-3 rounded-lg whitespace-pre-wrap">
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
                        <label className="block text-slate-600 font-semibold mb-2">
                          التسجيل الصوتي للقراءة
                        </label>
                        <div className="bg-white p-4 rounded-lg">
                          <audio
                            key={selectedSubmission.audio_url || selectedSubmission.id}
                            controls
                            className="w-full"
                          >
                            <source
                              src={selectedSubmission.audio_url}
                              type={inferAudioMimeFromUrl(selectedSubmission.audio_url)}
                            />
                            متصفحك لا يدعم تشغيل الصوت
                          </audio>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => setSelectedSubmission(null)}
                      variant="ghost"
                      size="sm"
                      className="text-sm md:text-base"
                    >
                      إغلاق
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-ink mb-2">اختر إجابة</h3>
                  <p className="text-slate-500">اختر إجابة من القائمة لعرضها</p>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedBackground>
  )
}

