'use client'

import React, { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'

interface AchievementTitle {
  id: string
  name_arabic: string
  rank: number
  min_stories_read: number
  min_forms_submitted: number
  description_arabic: string
  icon_emoji: string
}

interface StudentStats {
  stories_read: number
  forms_submitted: number
  total_reading_time_minutes: number
  average_grade: number | null
  current_title: AchievementTitle | null
}

interface StudentAchievement {
  title_id: string
  earned_at: string
}

export default function StudentProfile() {
  const router = useRouter()
  const { user, isAuthenticated, hydrated } = useAppStore()
  const [allAchievements, setAllAchievements] = useState<AchievementTitle[]>([])
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([])
  const [stats, setStats] = useState<StudentStats>({
    stories_read: 0,
    forms_submitted: 0,
    total_reading_time_minutes: 0,
    average_grade: null,
    current_title: null
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<{ action: string; date: string }[]>([])

  useEffect(() => {
    if (hydrated && isAuthenticated && user?.id) {
      fetchStudentData()
    }
  }, [hydrated, isAuthenticated, user?.id])

  const fetchStudentData = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      // Fetch all achievement titles
      const { data: achievementTitles, error: achievementsError } = await supabase
        .from('achievement_titles')
        .select('*')
        .order('rank', { ascending: true })
      
      if (achievementsError) throw achievementsError
      setAllAchievements(achievementTitles || [])

      // Fetch student's earned achievements
      const { data: studentAchievements, error: studentAchError } = await supabase
        .from('student_achievements')
        .select('title_id, earned_at')
        .eq('student_id', user.id)
      
      if (studentAchError) throw studentAchError
      const earnedIds = (studentAchievements || []).map((a: StudentAchievement) => a.title_id)
      setEarnedAchievements(earnedIds)

      // Fetch student data with current title
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          stories_read,
          forms_submitted,
          total_reading_time_minutes,
          current_title_id,
          achievement_titles:current_title_id (
            id,
            name_arabic,
            rank,
            icon_emoji,
            description_arabic,
            min_stories_read,
            min_forms_submitted
          )
        `)
        .eq('id', user.id)
        .single()
      
      if (studentError) throw studentError
      
      // Fetch average grade from submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('student_submissions')
        .select('grade')
        .eq('student_id', user.id)
        .not('grade', 'is', null)
      
      let avgGrade = null
      if (!submissionsError && submissions && submissions.length > 0) {
        const totalGrade = submissions.reduce((sum: number, s: { grade: number | null }) => sum + (s.grade || 0), 0)
        avgGrade = Math.round(totalGrade / submissions.length)
      }

      // Get current title from the joined data
      // Supabase returns either single object or array depending on relation type
      const achievementData = studentData?.achievement_titles
      const currentTitle: AchievementTitle | null = Array.isArray(achievementData) 
        ? (achievementData[0] as AchievementTitle | null) || null
        : (achievementData as AchievementTitle | null)
      
      setStats({
        stories_read: studentData?.stories_read || 0,
        forms_submitted: studentData?.forms_submitted || 0,
        total_reading_time_minutes: studentData?.total_reading_time_minutes || 0,
        average_grade: avgGrade,
        current_title: currentTitle
      })

      // Fetch recent activity (submissions)
      const { data: recentSubmissions, error: recentError } = await supabase
        .from('student_submissions')
        .select(`
          submitted_at,
          stories:story_id (title_arabic)
        `)
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5)
      
      if (!recentError && recentSubmissions) {
        const activities = recentSubmissions.map((sub: any) => {
          const storyTitle = sub.stories?.title_arabic || 'قصة'
          const date = formatRelativeDate(sub.submitted_at)
          return {
            action: `أرسلت نموذج تحليل: ${storyTitle}`,
            date
          }
        })
        setRecentActivity(activities)
      }

    } catch (error) {
      console.error('Error fetching student data:', error)
      toast.error('حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'اليوم'
    if (diffDays === 1) return 'أمس'
    if (diffDays < 7) return `منذ ${diffDays} أيام`
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`
    return `منذ ${Math.floor(diffDays / 30)} أشهر`
  }

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}د`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}س ${mins}د` : `${hours}س`
  }

  if (!hydrated || !isAuthenticated) {
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

  const studentName = (user as any)?.name || 'طالب'
  const currentTitleName = stats.current_title?.name_arabic || 'قارئ مبتدئ'
  const currentTitleIcon = stats.current_title?.icon_emoji || '📖'

  // Calculate progress percentages (max 25 stories for full bar)
  const storiesProgress = Math.min((stats.stories_read / 25) * 100, 100)
  const formsProgress = Math.min((stats.forms_submitted / 20) * 100, 100)

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
            <h1 className="text-3xl md:text-4xl font-bold text-ink">
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
              <div className="text-8xl mb-4 inline-block">{currentTitleIcon}</div>
              <h2 className="text-3xl font-bold text-ink mb-2">{studentName}</h2>
              <p className="text-gray-600 mb-4">{currentTitleName}</p>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{stats.stories_read}</div>
                  <p className="text-gray-600 text-sm">قصص مقروءة</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-accent-green">{stats.forms_submitted}</div>
                  <p className="text-gray-600 text-sm">نماذج مرسلة</p>
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
            <h3 className="text-2xl font-bold text-ink mb-4">🏆 إنجازاتك</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {loading ? (
                // Loading skeleton
                [...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <Card className="text-center py-4 opacity-40" elevation="sm">
                      <div className="text-4xl mb-2 animate-pulse">⏳</div>
                      <p className="text-sm font-bold">جاري التحميل...</p>
                    </Card>
                  </motion.div>
                ))
              ) : (
                allAchievements.map((achievement, i) => {
                  const isEarned = earnedAchievements.includes(achievement.id)
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      <Card
                        className={`text-center py-4 ${
                          isEarned ? '' : 'opacity-40 grayscale'
                        }`}
                        elevation="sm"
                      >
                        <div className="text-4xl mb-2">{achievement.icon_emoji}</div>
                        <p className="text-sm font-bold">{achievement.name_arabic}</p>
                        {isEarned && (
                          <p className="text-xs text-green-600 mt-1">✓ مكتسب</p>
                        )}
                        {!isEarned && (
                          <p className="text-xs text-gray-500 mt-1">
                            {achievement.min_stories_read} قصص - {achievement.min_forms_submitted} نماذج
                          </p>
                        )}
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-2xl font-bold text-ink mb-4">📊 إحصائياتك</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">القصص المقروءة</span>
                  <span className="text-3xl font-bold text-primary">{stats.stories_read}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${storiesProgress}%` }}
                  />
                </div>
              </Card>

              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">النماذج المرسلة</span>
                  <span className="text-3xl font-bold text-accent-green">{stats.forms_submitted}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-accent-green h-2 rounded-full transition-all duration-500"
                    style={{ width: `${formsProgress}%` }}
                  />
                </div>
              </Card>

              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">وقت القراءة الإجمالي</span>
                  <span className="text-3xl font-bold text-secondary">
                    {formatReadingTime(stats.total_reading_time_minutes)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.total_reading_time_minutes > 0 ? 'رائع! استمر في القراءة' : 'ابدأ القراءة الآن!'}
                </p>
              </Card>

              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">متوسط الدرجات</span>
                  <span className="text-3xl font-bold text-accent-red">
                    {stats.average_grade !== null ? `${stats.average_grade}%` : '-'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.average_grade !== null 
                    ? (stats.average_grade >= 80 ? 'أداء ممتاز!' : stats.average_grade >= 60 ? 'أداء جيد!' : 'استمر في التحسن!')
                    : 'لم يتم تقييمك بعد'
                  }
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
            <h3 className="text-2xl font-bold text-ink mb-4">📋 نشاطك الأخير</h3>
            <Card elevation="sm">
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item, i) => (
                    <div key={i} className="flex justify-between items-center pb-3 border-b last:border-0 last:pb-0">
                      <span className="text-gray-600">{item.action}</span>
                      <span className="text-sm text-gray-500">{item.date}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    لا يوجد نشاط حديث
                  </div>
                )}
              </div>
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
