'use client'

import React, { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { analyticsService } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { 
  BarChart3, 
  ArrowLeft, 
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  Clock,
  Star,
  Award,
  Activity,
  Target,
  CheckCircle
} from 'lucide-react'

interface AnalyticsData {
  totalStudents: number
  activeStudents: number
  totalStories: number
  totalForms: number
  totalSubmissions: number
  gradedSubmissions: number
  averageGrade: number
  topPerformingStudents: Array<{
    name: string
    stories_read: number
    forms_submitted: number
    average_grade: number
  }>
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
  gradeDistribution: Array<{
    range: string
    count: number
  }>
  monthlyProgress: Array<{
    month: string
    stories: number
    forms: number
  }>
}

export default function TeacherAnalytics() {
  const router = useRouter()
  const { user, userRole } = useAppStore()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userRole !== 'teacher') {
      return
    }
    loadAnalytics()
  }, [userRole, user])

  // Add focus listener to refresh analytics when returning to the page
  useEffect(() => {
    const handleFocus = () => {
      if (userRole === 'teacher' && user) {
        loadAnalytics()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }
  }, [userRole, user])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      
      // Check if user is available
      if (!user || !('access_code' in user)) {
        console.error('User access code is not available')
        toast.error('خطأ في بيانات المستخدم')
        return
      }
      
      const accessCode = (user as any).access_code as string
      console.log('Loading analytics for teacher:', accessCode)
      
      // Use the new analytics service
      const analyticsData = await analyticsService.getTeacherAnalytics(accessCode)
      console.log('Loaded analytics:', analyticsData)

      if (!analyticsData) {
        console.error('No analytics data returned from RPC')
        toast.error('لا توجد بيانات متاحة')
        return
      }

      console.log('Raw analytics data:', analyticsData)

      // Process top students data (handle null/undefined)
      const topStudentsArray = analyticsData.top_students || []
      const processedTopStudents = Array.isArray(topStudentsArray) 
        ? topStudentsArray.map((student: any) => ({
            name: student.name || '',
            stories_read: student.stories_read || 0,
            forms_submitted: student.forms_submitted || 0,
            average_grade: student.average_grade || 0
          }))
        : []

      // Process recent activity (handle null/undefined)
      const recentActivityArray = analyticsData.recent_activity || []
      const processedActivities = Array.isArray(recentActivityArray)
        ? recentActivityArray.map((activity: any) => ({
            type: activity.type || '',
            description: activity.description || '',
            timestamp: activity.timestamp || ''
          }))
        : []

      // Monthly progress (mock data for now)
      const monthlyProgress = [
        { month: 'يناير', stories: 15, forms: 8 },
        { month: 'فبراير', stories: 23, forms: 12 },
        { month: 'مارس', stories: 18, forms: 10 },
        { month: 'أبريل', stories: 31, forms: 18 },
        { month: 'مايو', stories: 28, forms: 15 },
        { month: 'يونيو', stories: 35, forms: 22 },
      ]

      // Grade distribution (mock data for now)
      const gradeDistribution = [
        { range: '90-100', count: Math.floor(analyticsData.graded_submissions * 0.3) },
        { range: '80-89', count: Math.floor(analyticsData.graded_submissions * 0.4) },
        { range: '70-79', count: Math.floor(analyticsData.graded_submissions * 0.2) },
        { range: '60-69', count: Math.floor(analyticsData.graded_submissions * 0.1) },
        { range: 'أقل من 60', count: Math.floor(analyticsData.graded_submissions * 0.1) },
      ]

      setAnalytics({
        totalStudents: analyticsData.total_students || 0,
        activeStudents: analyticsData.active_students || 0,
        totalStories: analyticsData.total_stories || 0,
        totalForms: analyticsData.total_forms || 0,
        totalSubmissions: analyticsData.total_submissions || 0,
        gradedSubmissions: analyticsData.graded_submissions || 0,
        averageGrade: Math.round(Number(analyticsData.average_grade) || 0),
        topPerformingStudents: processedTopStudents,
        recentActivity: processedActivities,
        gradeDistribution,
        monthlyProgress
      })
      
      console.log('Analytics processed and set:', analyticsData.total_students, 'students')
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('فشل تحميل التحليلات')
    } finally {
      setIsLoading(false)
    }
  }

  if (userRole !== 'teacher') {
    router.push('/')
    return null
  }

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="w-full min-h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <p className="text-xl text-white">جاري تحميل التحليلات...</p>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  if (!analytics) {
    return (
      <AnimatedBackground>
        <div className="w-full min-h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <BarChart3 className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">لا توجد بيانات</h3>
            <p className="text-gray-400">لا توجد بيانات تحليلية متاحة</p>
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
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-purple-400" />
                لوحة التحليلات
              </h1>
              <p className="text-gray-300 text-lg font-semibold">
                إحصائيات وتقارير مفصلة عن أداء الطلاب
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

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20">
                <div className="flex items-center gap-4">
                  <Users className="w-12 h-12 text-blue-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-white">{analytics.totalStudents}</h3>
                    <p className="text-gray-300 font-semibold">إجمالي الطلاب</p>
                    <p className="text-sm text-blue-300">{analytics.activeStudents} نشط</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20">
                <div className="flex items-center gap-4">
                  <BookOpen className="w-12 h-12 text-green-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-white">{analytics.totalStories}</h3>
                    <p className="text-gray-300 font-semibold">القصص المتاحة</p>
                    <p className="text-sm text-green-300">{analytics.totalForms} نموذج</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20">
                <div className="flex items-center gap-4">
                  <FileText className="w-12 h-12 text-yellow-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-white">{analytics.totalSubmissions}</h3>
                    <p className="text-gray-300 font-semibold">إجمالي الإجابات</p>
                    <p className="text-sm text-yellow-300">{analytics.gradedSubmissions} مقيمة</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20">
                <div className="flex items-center gap-4">
                  <Star className="w-12 h-12 text-purple-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-white">{analytics.averageGrade}</h3>
                    <p className="text-gray-300 font-semibold">متوسط الدرجات</p>
                    <p className="text-sm text-purple-300">من 100</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Performing Students */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-400" />
                  أفضل الطلاب أداءً
                </h3>
                <div className="space-y-3">
                  {analytics.topPerformingStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-slate-600 text-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{student.name}</h4>
                          <p className="text-gray-400 text-sm">
                            {student.stories_read} قصة • {student.forms_submitted} نموذج
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{student.average_grade}</p>
                        <p className="text-xs text-gray-400">متوسط</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Grade Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-green-400" />
                  توزيع الدرجات
                </h3>
                <div className="space-y-3">
                  {analytics.gradeDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-300 font-semibold">{item.range}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              index === 0 ? 'bg-green-500' :
                              index === 1 ? 'bg-blue-500' :
                              index === 2 ? 'bg-yellow-500' :
                              index === 3 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(item.count / Math.max(...analytics.gradeDistribution.map(d => d.count))) * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-bold w-8 text-left">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-400" />
                النشاط الأخير
              </h3>
              <div className="space-y-3">
                {analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.type === 'login' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : activity.type === 'submission' ? (
                        <FileText className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Activity className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{activity.description}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(activity.timestamp).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedBackground>
  )
}
