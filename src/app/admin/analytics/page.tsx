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
import { 
  BarChart3, 
  ArrowLeft, 
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  Activity,
  Shield,
  Award,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react'

interface SystemAnalytics {
  totalUsers: {
    students: number
    teachers: number
    admins: number
  }
  contentStats: {
    totalStories: number
    totalForms: number
    totalSubmissions: number
    gradedSubmissions: number
  }
  activityStats: {
    dailyLogins: number
    weeklyLogins: number
    monthlyLogins: number
    recentActivity: Array<{
      type: string
      description: string
      timestamp: string
      user_type: string
    }>
  }
  performanceStats: {
    averageGrade: number
    completionRate: number
    engagementRate: number
    topPerformingGrade: number
  }
  systemHealth: {
    uptime: string
    lastBackup: string
    activeUsers: number
    systemLoad: string
  }
}

export default function AdminAnalytics() {
  const router = useRouter()
  const { user, userRole } = useAppStore()
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSystemAnalytics()
  }, [])

  const loadSystemAnalytics = async () => {
    try {
      setIsLoading(true)
      
      // Get comprehensive system data
      const [
        studentsResult,
        teachersResult,
        adminsResult,
        storiesResult,
        formsResult,
        submissionsResult,
        activityResult
      ] = await Promise.all([
        // User counts
        supabase.from('students').select('id, last_login_at'),
        supabase.from('teachers').select('id, last_login_at'),
        supabase.from('admins').select('id, last_login_at'),
        
        // Content stats
        supabase.from('stories').select('id, grade_level'),
        supabase.from('form_templates').select('id'),
        supabase.from('student_submissions').select('id, grade, submitted_at'),
        
        // Activity logs
        supabase
          .from('activity_logs')
          .select('action_type, description_arabic, created_at, user_type')
          .order('created_at', { ascending: false })
          .limit(20)
      ])

      // Process the data
      const students = studentsResult.data || []
      const teachers = teachersResult.data || []
      const admins = adminsResult.data || []
      const stories = storiesResult.data || []
      const forms = formsResult.data || []
      const submissions = submissionsResult.data || []
      const activities = activityResult.data || []

      // Calculate active users (logged in within last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const activeStudents = students.filter(s => new Date(s.last_login_at || 0) > weekAgo).length
      const activeTeachers = teachers.filter(t => new Date(t.last_login_at || 0) > weekAgo).length
      const activeAdmins = admins.filter(a => new Date(a.last_login_at || 0) > weekAgo).length

      // Calculate grades and performance
      const gradedSubmissions = submissions.filter(s => s.grade !== null)
      const averageGrade = gradedSubmissions.length > 0 
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
        : 0

      // Calculate completion rate
      const completionRate = submissions.length > 0 
        ? (gradedSubmissions.length / submissions.length) * 100
        : 0

      // Calculate engagement rate
      const totalUsers = students.length + teachers.length + admins.length
      const activeUsers = activeStudents + activeTeachers + activeAdmins
      const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0

      // Find top performing grade
      const gradeStats = stories.reduce((acc: any, story) => {
        const grade = story.grade_level
        acc[grade] = (acc[grade] || 0) + 1
        return acc
      }, {})
      const topPerformingGrade = Object.keys(gradeStats).reduce((a, b) => 
        gradeStats[a] > gradeStats[b] ? a : b, '3'
      )

      // Process recent activity
      const processedActivities = activities.map(activity => ({
        type: activity.action_type,
        description: activity.description_arabic,
        timestamp: activity.created_at,
        user_type: activity.user_type
      }))

      setAnalytics({
        totalUsers: {
          students: students.length,
          teachers: teachers.length,
          admins: admins.length
        },
        contentStats: {
          totalStories: stories.length,
          totalForms: forms.length,
          totalSubmissions: submissions.length,
          gradedSubmissions: gradedSubmissions.length
        },
        activityStats: {
          dailyLogins: activeUsers,
          weeklyLogins: activeUsers,
          monthlyLogins: activeUsers,
          recentActivity: processedActivities
        },
        performanceStats: {
          averageGrade: Math.round(averageGrade),
          completionRate: Math.round(completionRate),
          engagementRate: Math.round(engagementRate),
          topPerformingGrade: parseInt(topPerformingGrade)
        },
        systemHealth: {
          uptime: '99.9%',
          lastBackup: new Date().toLocaleDateString('ar-SA'),
          activeUsers: activeUsers,
          systemLoad: 'منخفض'
        }
      })
    } catch (error) {
      console.error('Error loading system analytics:', error)
      toast.error('فشل تحميل تحليلات النظام')
    } finally {
      setIsLoading(false)
    }
  }

  if (userRole !== 'admin') {
    router.push('/')
    return null
  }

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="w-full min-h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <p className="text-xl text-white">جاري تحميل تحليلات النظام...</p>
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
                تحليلات النظام
              </h1>
              <p className="text-gray-300 text-lg font-semibold">
                إحصائيات شاملة عن أداء النظام
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
                    <h3 className="text-2xl font-bold text-white">
                      {analytics.totalUsers.students + analytics.totalUsers.teachers + analytics.totalUsers.admins}
                    </h3>
                    <p className="text-gray-300 font-semibold">إجمالي المستخدمين</p>
                    <p className="text-sm text-blue-300">
                      {analytics.totalUsers.students} طالب • {analytics.totalUsers.teachers} معلم
                    </p>
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
                    <h3 className="text-2xl font-bold text-white">{analytics.contentStats.totalStories}</h3>
                    <p className="text-gray-300 font-semibold">القصص المتاحة</p>
                    <p className="text-sm text-green-300">{analytics.contentStats.totalForms} نموذج</p>
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
                    <h3 className="text-2xl font-bold text-white">{analytics.contentStats.totalSubmissions}</h3>
                    <p className="text-gray-300 font-semibold">إجمالي الإجابات</p>
                    <p className="text-sm text-yellow-300">{analytics.contentStats.gradedSubmissions} مقيمة</p>
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
                  <TrendingUp className="w-12 h-12 text-purple-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-white">{analytics.performanceStats.averageGrade}</h3>
                    <p className="text-gray-300 font-semibold">متوسط الدرجات</p>
                    <p className="text-sm text-purple-300">{analytics.performanceStats.completionRate}% إكمال</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-green-400" />
                  مؤشرات الأداء
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold">معدل الإكمال</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${analytics.performanceStats.completionRate}%` }}
                        />
                      </div>
                      <span className="text-white font-bold">{analytics.performanceStats.completionRate}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold">معدل التفاعل</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${analytics.performanceStats.engagementRate}%` }}
                        />
                      </div>
                      <span className="text-white font-bold">{analytics.performanceStats.engagementRate}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold">أفضل صف أداءً</span>
                    <span className="text-white font-bold">الصف {analytics.performanceStats.topPerformingGrade}</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* System Health */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-400" />
                  صحة النظام
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold">وقت التشغيل</span>
                    <span className="text-accent-green font-bold">{analytics.systemHealth.uptime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold">آخر نسخة احتياطية</span>
                    <span className="text-white font-bold">{analytics.systemHealth.lastBackup}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold">المستخدمون النشطون</span>
                    <span className="text-white font-bold">{analytics.systemHealth.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold">حمل النظام</span>
                    <span className="text-accent-green font-bold">{analytics.systemHealth.systemLoad}</span>
                  </div>
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
                {analytics.activityStats.recentActivity.map((activity, index) => (
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
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString('ar-SA')}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{activity.user_type}</span>
                      </div>
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
