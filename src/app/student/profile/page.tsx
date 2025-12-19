'use client'

import React, { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'

interface StudentData {
  id: string
  name: string
  stories_read: number
  forms_submitted: number
  total_reading_time_minutes: number
  current_title: {
    name_arabic: string
    icon_emoji: string
    rank: number
  } | null
}

interface Achievement {
  id: string
  name_arabic: string
  icon_emoji: string
  rank: number
  min_stories_read: number
  min_forms_submitted: number
  earned: boolean
}

export default function StudentProfile() {
  const router = useRouter()
  const { user, isAuthenticated, hydrated } = useAppStore()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [averageGrade, setAverageGrade] = useState<number | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (hydrated && isAuthenticated && user) {
      loadStudentData()
    }
  }, [hydrated, isAuthenticated, user])

  const loadStudentData = async () => {
    try {
      setIsLoading(true)
      const accessCode = (user as any)?.access_code

      if (!accessCode) {
        console.error('No access code found')
        return
      }

      // Fetch student data with current title
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          stories_read,
          forms_submitted,
          total_reading_time_minutes,
          current_title_id,
          achievement_titles!students_current_title_id_fkey (
            name_arabic,
            icon_emoji,
            rank
          )
        `)
        .eq('access_code', accessCode)
        .single()

      if (studentError) {
        console.error('Error fetching student:', studentError)
        return
      }

      // Format student data
      const titleData = student.achievement_titles as any
      setStudentData({
        id: student.id,
        name: student.name || 'طالب',
        stories_read: student.stories_read || 0,
        forms_submitted: student.forms_submitted || 0,
        total_reading_time_minutes: student.total_reading_time_minutes || 0,
        current_title: titleData ? {
          name_arabic: titleData.name_arabic,
          icon_emoji: titleData.icon_emoji,
          rank: titleData.rank
        } : null
      })

      // Fetch all achievement titles
      const { data: allTitles, error: titlesError } = await supabase
        .from('achievement_titles')
        .select('*')
        .order('rank', { ascending: true })

      if (!titlesError && allTitles) {
        // Determine which achievements are earned
        const earnedAchievements = allTitles.map(title => ({
          ...title,
          earned: (student.stories_read || 0) >= title.min_stories_read && 
                  (student.forms_submitted || 0) >= title.min_forms_submitted
        }))
        setAchievements(earnedAchievements)
      }

      // Fetch average grade from submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('student_submissions')
        .select('grade')
        .eq('student_id', student.id)
        .not('grade', 'is', null)

      if (!submissionsError && submissions && submissions.length > 0) {
        const total = submissions.reduce((sum, sub) => sum + (sub.grade || 0), 0)
        setAverageGrade(Math.round(total / submissions.length))
      }

      // Fetch recent activity (last 5 submissions)
      const { data: recent, error: recentError } = await supabase
        .from('student_submissions')
        .select(`
          id,
          submitted_at,
          grade,
          stories!student_submissions_story_id_fkey (
            title_arabic
          )
        `)
        .eq('student_id', student.id)
        .order('submitted_at', { ascending: false })
        .limit(5)

      if (!recentError && recent) {
        setRecentActivity(recent.map(item => ({
          action: `أرسلت نموذج: ${(item.stories as any)?.title_arabic || 'قصة'}`,
          date: formatDate(item.submitted_at),
          grade: item.grade
        })))
      }

    } catch (error) {
      console.error('Error loading student data:', error)
      toast.error('فشل تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'اليوم'
    if (diffDays === 1) return 'أمس'
    if (diffDays < 7) return `قبل ${diffDays} أيام`
    return date.toLocaleDateString('ar-SA')
  }

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} ساعة`
    return `${hours}س ${mins}د`
  }

  if (!hydrated || !isAuthenticated || isLoading) {
    return (
      <AnimatedBackground>
        <div className="w-full h-full flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">👤</div>
            <p className="text-2xl font-bold text-white">جاري التحميل...</p>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  const studentName = studentData?.name || (user as any)?.name || 'طالب'
  const currentTitle = studentData?.current_title
  const storiesRead = studentData?.stories_read || 0
  const formsSubmitted = studentData?.forms_submitted || 0
  const readingTime = studentData?.total_reading_time_minutes || 0

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
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              ملفك الشخصي 👤
            </h1>
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="md"
            >
              العودة
            </Button>
          </div>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="text-center py-8 mb-8" elevation="md">
              <div className="text-8xl mb-4 inline-block">
                {currentTitle?.icon_emoji || '📖'}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{studentName}</h2>
              <p className="text-xl text-primary font-semibold mb-4">
                {currentTitle?.name_arabic || 'قارئ مبتدئ'}
              </p>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{storiesRead}</div>
                  <p className="text-gray-300 text-sm">قصص مقروءة</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-accent-green">{formsSubmitted}</div>
                  <p className="text-gray-300 text-sm">نماذج مرسلة</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h3 className="text-2xl font-bold text-white mb-4">🏆 إنجازاتك</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {achievements.map((achievement, i) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <Card
                    className={`text-center py-4 ${
                      achievement.earned ? '' : 'opacity-40 grayscale'
                    }`}
                    elevation="sm"
                  >
                    <div className="text-4xl mb-2">{achievement.icon_emoji}</div>
                    <p className="text-sm font-bold">{achievement.name_arabic}</p>
                    {achievement.earned && (
                      <span className="text-xs text-accent-green">✓ مكتسب</span>
                    )}
                    {!achievement.earned && (
                      <span className="text-xs text-gray-400">
                        {achievement.min_stories_read} قصص / {achievement.min_forms_submitted} نماذج
                      </span>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-2xl font-bold text-white mb-4">📊 إحصائياتك</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-300">القصص المقروءة</span>
                  <span className="text-3xl font-bold text-primary">{storiesRead}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (storiesRead / 25) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">الهدف: 25 قصة</p>
              </Card>

              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-300">النماذج المرسلة</span>
                  <span className="text-3xl font-bold text-accent-green">{formsSubmitted}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-accent-green h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (formsSubmitted / 20) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">الهدف: 20 نموذج</p>
              </Card>

              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-300">وقت القراءة الإجمالي</span>
                  <span className="text-3xl font-bold text-secondary">
                    {formatReadingTime(readingTime)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {readingTime > 0 ? 'رائع! استمر في القراءة' : 'ابدأ القراءة الآن!'}
                </p>
              </Card>

              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-300">متوسط الدرجات</span>
                  <span className={`text-3xl font-bold ${
                    averageGrade === null ? 'text-gray-400' :
                    averageGrade >= 80 ? 'text-accent-green' :
                    averageGrade >= 60 ? 'text-yellow-400' : 'text-accent-red'
                  }`}>
                    {averageGrade !== null ? `${averageGrade}%` : '-'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {averageGrade === null ? 'لا توجد درجات بعد' :
                   averageGrade >= 80 ? 'أداء ممتاز!' :
                   averageGrade >= 60 ? 'جيد، استمر!' : 'حاول أكثر!'}
                </p>
              </Card>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">📋 نشاطك الأخير</h3>
            <Card elevation="sm">
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-700 last:border-0 last:pb-0">
                      <div>
                        <span className="text-gray-300">{item.action}</span>
                        {item.grade !== null && (
                          <span className={`mr-2 text-sm px-2 py-0.5 rounded ${
                            item.grade >= 80 ? 'bg-green-500/20 text-green-300' :
                            item.grade >= 60 ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {item.grade}%
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">{item.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📝</div>
                  <p>لا يوجد نشاط بعد. ابدأ بقراءة قصة!</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Button
              onClick={() => router.push('/student')}
              size="lg"
              variant="primary"
            >
              العودة إلى القصص
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedBackground>
  )
}
