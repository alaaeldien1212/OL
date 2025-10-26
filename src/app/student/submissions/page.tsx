'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { studentSubmissionsService } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { 
  BookOpen,
  FileText,
  Award,
  Mic,
  Star,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react'

interface Submission {
  submission_id: string
  story_title: string
  form_title: string
  submitted_at: string
  grade?: number
  voice_grade?: number
  feedback?: string
}

export default function StudentSubmissionsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAppStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/')
      return
    }

    loadSubmissions()
  }, [isAuthenticated, user, router])

  const loadSubmissions = async () => {
    try {
      setIsLoading(true)
      
      const studentData = user as any
      const studentAccessCode = studentData.access_code
      
      const submissionsData = await studentSubmissionsService.getStudentSubmissions(studentAccessCode)
      setSubmissions(submissionsData || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('فشل تحميل الإجابات')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateFinalGrade = (grade?: number, voiceGrade?: number) => {
    if (grade !== null && grade !== undefined && voiceGrade !== null && voiceGrade !== undefined) {
      return Math.round((grade + voiceGrade) / 2)
    }
    return grade ?? voiceGrade ?? null
  }

  const getGradeColor = (finalGrade: number) => {
    if (finalGrade >= 90) return 'text-green-400'
    if (finalGrade >= 70) return 'text-blue-400'
    if (finalGrade >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getGradeBgColor = (finalGrade: number) => {
    if (finalGrade >= 90) return 'from-green-600/20 to-green-700/20 border-green-500/30'
    if (finalGrade >= 70) return 'from-blue-600/20 to-blue-700/20 border-blue-500/30'
    if (finalGrade >= 50) return 'from-yellow-600/20 to-yellow-700/20 border-yellow-500/30'
    return 'from-red-600/20 to-red-700/20 border-red-500/30'
  }

  return (
    <AnimatedBackground>
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-6"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Star className="w-8 h-8 text-secondary" />
                إجاباتي وتقييماتي
              </h1>
              <p className="text-gray-200">اطلع على تقييماتك من المعلم</p>
            </div>
            <Button
              onClick={() => router.push('/student')}
              variant="ghost"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              العودة
            </Button>
          </motion.div>

          {/* Submissions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {isLoading ? (
              <Card>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-200">جاري التحميل...</p>
                </div>
              </Card>
            ) : submissions.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد إجابات حتى الآن</h3>
                  <p className="text-gray-400">ابدأ بقراءة القصص وإرسال الإجابات!</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map((submission, index) => {
                  const finalGrade = calculateFinalGrade(submission.grade, submission.voice_grade)
                  
                  return (
                    <motion.div
                      key={submission.submission_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-all">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Story Info */}
                          <div className="md:col-span-6">
                            <div className="flex items-start gap-3 mb-3">
                              <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                              <div>
                                <h3 className="font-bold text-white mb-1">{submission.story_title}</h3>
                                <p className="text-sm text-gray-400 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  {submission.form_title}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(submission.submitted_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>

                          {/* Grades */}
                          {finalGrade !== null ? (
                            <div className="md:col-span-6 grid grid-cols-2 gap-3">
                              {/* Final Grade */}
                              <div className={`bg-gradient-to-br ${getGradeBgColor(finalGrade)} rounded-lg p-3 border text-center`}>
                                <label className="block text-white font-semibold mb-1 text-xs">
                                  المعدل النهائي
                                </label>
                                <p className={`font-bold text-2xl ${getGradeColor(finalGrade)}`}>
                                  {finalGrade}/100
                                </p>
                              </div>

                              {/* AI Grade */}
                              {submission.grade !== null && submission.grade !== undefined && (
                                <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg p-3 border border-blue-500/30 text-center">
                                  <label className="block text-blue-300 font-semibold mb-1 text-xs">
                                    تقييم النموذج
                                  </label>
                                  <p className="text-white font-bold text-lg">{submission.grade}/100</p>
                                </div>
                              )}

                              {/* Voice Grade */}
                              {submission.voice_grade !== null && submission.voice_grade !== undefined && (
                                <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-lg p-3 border border-purple-500/30 text-center">
                                  <label className="block text-purple-300 font-semibold mb-1 text-xs">
                                    تقييم القراءة الصوتية
                                  </label>
                                  <p className="text-white font-bold text-lg">{submission.voice_grade}/100</p>
                                </div>
                              )}

                              {/* Feedback */}
                              {submission.feedback && (
                                <div className="col-span-2 bg-slate-800 rounded-lg p-3 text-sm text-gray-300">
                                  <CheckCircle className="w-4 h-4 inline-block ml-1 text-green-400" />
                                  {submission.feedback}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="md:col-span-6 flex items-center justify-center">
                              <div className="text-center">
                                <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                                <p className="text-yellow-400 font-semibold">في انتظار التقييم</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Stats Summary */}
          {!isLoading && submissions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Card>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-accent-green" />
                  ملخص إنجازاتك
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Submissions */}
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white mb-1">{submissions.length}</div>
                    <p className="text-sm text-gray-400">إجمالي الإجابات</p>
                  </div>

                  {/* Graded Submissions */}
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white mb-1">
                      {submissions.filter(s => calculateFinalGrade(s.grade, s.voice_grade) !== null).length}
                    </div>
                    <p className="text-sm text-gray-400">مقيم</p>
                  </div>

                  {/* Average Grade */}
                  {(() => {
                    const gradedSubmissions = submissions.filter(s => {
                      const finalGrade = calculateFinalGrade(s.grade, s.voice_grade)
                      return finalGrade !== null && finalGrade !== undefined
                    })
                    
                    if (gradedSubmissions.length === 0) return null
                    
                    const avgGrade = Math.round(
                      gradedSubmissions.reduce((sum, s) => sum + calculateFinalGrade(s.grade, s.voice_grade)!, 0) / gradedSubmissions.length
                    )
                    
                    return (
                      <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-lg p-4 text-center border border-purple-500/30">
                        <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white mb-1">{avgGrade}%</div>
                        <p className="text-sm text-gray-400">المعدل العام</p>
                      </div>
                    )
                  })()}

                  {/* Pending */}
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white mb-1">
                      {submissions.filter(s => calculateFinalGrade(s.grade, s.voice_grade) === null).length}
                    </div>
                    <p className="text-sm text-gray-400">في الانتظار</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatedBackground>
  )
}

