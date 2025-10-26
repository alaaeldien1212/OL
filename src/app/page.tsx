'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { authService, leaderboardService } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { Trophy, Crown, Medal, Users, BookOpen, LogIn, UserCheck, Shield, GraduationCap } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  name: string
  stories_read: number
  forms_submitted: number
  combined_score: number
  grade: number
  current_title?: string
  avg_grade?: number
  graded_submissions?: number
}

export default function HomePage() {
  const router = useRouter()
  const { setUser, setError, setLoading } = useAppStore()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginType, setLoginType] = useState<'admin' | 'teacher' | 'student'>('student')
  const [accessCode, setAccessCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [needsRegistration, setNeedsRegistration] = useState(false)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      setIsLoadingLeaderboard(true)
      const data = await leaderboardService.getLeaderboard()
      // Only show top 3 students on home page
      setLeaderboard((data || []).slice(0, 3))
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      setLeaderboard([]) // Set empty array on error
    } finally {
      setIsLoadingLeaderboard(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoading(true)

    try {
      if (needsRegistration) {
        // Student registration
        const student = await authService.registerStudent(accessCode, studentName)
        setUser(student, 'student')
        toast.success(`مرحباً ${studentName}! تم إنشاء حسابك بنجاح 🎉`)
        router.push('/student')
      } else {
        // Regular login
        const result = await authService.loginWithAccessCode(accessCode)
        setUser(result.user, result.type)
        
        if (result.type === 'admin') {
          toast.success('مرحباً أيها المسؤول! 👨‍💼')
          router.push('/admin')
        } else if (result.type === 'teacher') {
          toast.success(`مرحباً ${result.user.name}! 👩‍🏫`)
          router.push('/teacher')
        } else {
          toast.success(`مرحباً ${result.user.name}! 👦`)
          router.push('/student')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message)
      
      if (error.message.includes('not found')) {
        setNeedsRegistration(true)
        toast('هذا أول دخول لك! الرجاء إدخال اسمك', { icon: '👋' })
      } else {
        toast.error(error.message)
      }
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-400" />
      case 1: return <Medal className="w-6 h-6 text-gray-300" />
      case 2: return <Medal className="w-6 h-6 text-amber-600" />
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">{index + 1}</span>
    }
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
      case 1: return 'bg-gradient-to-r from-gray-300 to-gray-400'
      case 2: return 'bg-gradient-to-r from-amber-600 to-amber-700'
      default: return 'bg-slate-700'
    }
  }

  return (
    <div className="relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full p-2 md:p-4" dir="rtl">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-3"
          >
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">
              📚 المكتبة الإلكترونية للقصص
            </h1>
            <p className="text-base text-gray-300 mb-2">
              منصة تعليمية تفاعلية لتعلم اللغة العربية
            </p>
          </motion.div>

          {/* Leaderboard Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <Card className="p-3">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-white">جدول الترتيب</h2>
              </div>
              
              {isLoadingLeaderboard ? (
                <div className="text-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-300 mt-1 text-sm">جاري تحميل الترتيب...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-2">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <p className="text-gray-300 text-sm">لا يوجد طلاب بعد</p>
                  <p className="text-gray-400 text-xs">كن أول من ينضم إلى المكتبة!</p>
                </div>
              ) : (
                <div className="flex justify-center items-end gap-3 py-2">
                  {/* 2nd Place */}
                  {leaderboard[1] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="flex flex-col items-center"
                    >
                      <div className="bg-gradient-to-b from-gray-300 to-gray-400 text-slate-900 w-20 h-20 rounded-full flex items-center justify-center mb-3">
                        <Medal className="w-8 h-8" />
                      </div>
                      <div className="bg-slate-700/80 backdrop-blur-sm rounded-lg p-4 text-center min-w-[120px]">
                        <h3 className="text-lg font-bold text-white">{leaderboard[1].name}</h3>
                        <p className="text-sm text-gray-300">المركز الثاني</p>
                        {leaderboard[1].current_title && (
                          <div className="text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded-full mt-1">
                            🏅 {leaderboard[1].current_title}
                          </div>
                        )}
                        <div className="text-xl font-bold text-gray-300 mt-2">{leaderboard[1].combined_score}</div>
                        {leaderboard[1].avg_grade && (
                          <div className="text-sm text-purple-300 mt-1">
                            معدل: {Math.round(leaderboard[1].avg_grade)}%
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* 1st Place */}
                  {leaderboard[0] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-white w-24 h-24 rounded-full flex items-center justify-center mb-3 shadow-lg">
                        <Crown className="w-10 h-10" />
                      </div>
                      <div className="bg-gradient-to-r from-slate-700 to-slate-800 backdrop-blur-sm rounded-lg p-4 text-center min-w-[140px] border-2 border-yellow-500/30">
                        <h3 className="text-xl font-bold text-white">{leaderboard[0].name}</h3>
                        <p className="text-sm text-yellow-300">المركز الأول</p>
                        {leaderboard[0].current_title && (
                          <div className="text-xs bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded-full mt-1">
                            🏅 {leaderboard[0].current_title}
                          </div>
                        )}
                        <div className="text-2xl font-bold text-yellow-300 mt-2">{leaderboard[0].combined_score}</div>
                        {leaderboard[0].avg_grade && (
                          <div className="text-sm text-purple-300 mt-1">
                            معدل: {Math.round(leaderboard[0].avg_grade)}%
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* 3rd Place */}
                  {leaderboard[2] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      <div className="bg-gradient-to-b from-amber-600 to-amber-700 text-white w-20 h-20 rounded-full flex items-center justify-center mb-3">
                        <Medal className="w-8 h-8" />
                      </div>
                      <div className="bg-slate-700/80 backdrop-blur-sm rounded-lg p-4 text-center min-w-[120px]">
                        <h3 className="text-lg font-bold text-white">{leaderboard[2].name}</h3>
                        <p className="text-sm text-gray-300">المركز الثالث</p>
                        {leaderboard[2].current_title && (
                          <div className="text-xs bg-amber-600/50 text-amber-300 px-2 py-1 rounded-full mt-1">
                            🏅 {leaderboard[2].current_title}
                          </div>
                        )}
                        <div className="text-xl font-bold text-gray-300 mt-2">{leaderboard[2].combined_score}</div>
                        {leaderboard[2].avg_grade && (
                          <div className="text-sm text-purple-300 mt-1">
                            معدل: {Math.round(leaderboard[2].avg_grade)}%
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Login Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4"
          >
            {/* Admin Login */}
            <Card className="p-3 text-center hover:scale-105 transition-transform duration-200">
              <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="text-base font-bold text-white mb-1">دخول المسؤول</h3>
              <p className="text-gray-300 mb-2 text-xs">إدارة النظام والمعلمين</p>
              <Button
                onClick={() => {
                  setLoginType('admin')
                  setShowLoginForm(true)
                }}
                variant="primary"
                size="lg"
                className="w-full"
                icon={<LogIn className="w-5 h-5" />}
              >
                دخول المسؤول
              </Button>
            </Card>

            {/* Teacher Login */}
            <Card className="p-3 text-center hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-8 h-8 text-secondary mx-auto mb-2" />
              <h3 className="text-base font-bold text-white mb-1">دخول المعلم</h3>
              <p className="text-gray-300 mb-2 text-xs">إدارة الطلاب والقصص</p>
              <Button
                onClick={() => {
                  setLoginType('teacher')
                  setShowLoginForm(true)
                }}
                variant="secondary"
                size="lg"
                className="w-full"
                icon={<UserCheck className="w-5 h-5" />}
              >
                دخول المعلم
              </Button>
            </Card>

            {/* Student Login */}
            <Card className="p-3 text-center hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-8 h-8 text-accent-green mx-auto mb-2" />
              <h3 className="text-base font-bold text-white mb-1">دخول الطالب</h3>
              <p className="text-gray-300 mb-2 text-xs">قراءة القصص وحل النماذج</p>
              <Button
                onClick={() => {
                  setLoginType('student')
                  setShowLoginForm(true)
                }}
                variant="success"
                size="lg"
                className="w-full"
                icon={<BookOpen className="w-5 h-5" />}
              >
                دخول الطالب
              </Button>
            </Card>
          </motion.div>

          {/* Login Form Modal */}
          {showLoginForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto"
              onClick={() => setShowLoginForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-xl p-4 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  {loginType === 'admin' && <Shield className="w-5 h-5 text-primary" />}
                  {loginType === 'teacher' && <GraduationCap className="w-5 h-5 text-secondary" />}
                  {loginType === 'student' && <BookOpen className="w-5 h-5 text-accent-green" />}
                  <h3 className="text-xl font-bold text-white">
                    {loginType === 'admin' && 'دخول المسؤول'}
                    {loginType === 'teacher' && 'دخول المعلم'}
                    {loginType === 'student' && 'دخول الطالب'}
                  </h3>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2">
                      رمز الدخول
                    </label>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="أدخل رمز الدخول"
                      className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {needsRegistration && (
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        اسمك الكامل
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      {needsRegistration ? 'إنشاء الحساب' : 'دخول'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        setShowLoginForm(false)
                        setNeedsRegistration(false)
                        setAccessCode('')
                        setStudentName('')
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>

                <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                  <h4 className="text-white font-semibold mb-2 text-sm">رموز الدخول التجريبية:</h4>
                  <div className="text-xs text-gray-300 space-y-1">
                    <p><strong>مسؤول:</strong> ADMIN2025</p>
                    <p><strong>معلم:</strong> TEACH3A2025</p>
                    <p><strong>طالب:</strong> اطلب من معلمك</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            border: '1px solid #334155',
          },
        }}
      />
    </div>
  )
}