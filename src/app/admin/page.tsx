'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { analyticsService } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { Users, Shield, BarChart3, Settings, FileText, LogOut, GraduationCap } from 'lucide-react'

interface AdminAnalytics {
  total_students: number
  total_teachers: number
  total_stories: number
  total_forms: number
  total_submissions: number
  daily_activity: number
  active_students: number
  active_teachers: number
  graded_submissions: number
  pending_submissions: number
  total_classrooms: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, userRole, isAuthenticated } = useAppStore()
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('Admin page useEffect:', { isAuthenticated, userRole, user })
    if (!isAuthenticated || userRole !== 'admin') {
      console.log('Redirecting to home page - not authenticated or not admin')
      router.push('/')
    } else {
      console.log('Loading analytics for admin user')
      loadAnalytics()
    }
  }, [isAuthenticated, userRole, router])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      console.log('loadAnalytics called with user:', user)
      
      if (!user || !('access_code' in user)) {
        console.error('User access code is not available')
        toast.error('خطأ في بيانات المستخدم')
        return
      }
      
      const accessCode = (user as any).access_code as string
      console.log('Loading admin analytics for access code:', accessCode)
      
      const analyticsData = await analyticsService.getAdminAnalytics(accessCode)
      console.log('Loaded admin analytics:', analyticsData)

      if (!analyticsData) {
        console.error('No analytics data returned')
        toast.error('لا توجد بيانات متاحة')
        return
      }

      console.log('Setting analytics data:', analyticsData)
      console.log('Analytics data type:', typeof analyticsData)
      console.log('Analytics data keys:', analyticsData ? Object.keys(analyticsData) : 'null')
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading admin analytics:', error)
      console.error('Error details:', error)
      toast.error('حدث خطأ في تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    const { logout } = useAppStore.getState()
    logout()
    router.push('/')
  }

  const adminName = (user as any)?.name || 'مسؤول'

  return (
    <AnimatedBackground>
      <Toaster position="top-center" />
      <div className="w-full min-h-screen p-4 md:p-6 relative z-10" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto relative z-10"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="w-10 h-10 text-primary" />
                لوحة تحكم الإدارة
              </h1>
              <p className="text-gray-300 text-lg font-semibold">مرحبا {adminName}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="md"
              icon={<LogOut className="w-5 h-5" />}
            >
              تسجيل خروج
            </Button>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center relative z-20" elevation="sm">
                <div className="text-5xl mb-2">👨‍🏫</div>
                <p className="text-gray-600 text-sm mb-1">المعلمون</p>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-primary">{analytics?.total_teachers || 0}</p>
                )}
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center relative z-20" elevation="sm">
                <div className="text-5xl mb-2">👦</div>
                <p className="text-gray-600 text-sm mb-1">الطلاب</p>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-accent-green">{analytics?.total_students || 0}</p>
                )}
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center relative z-20" elevation="sm">
                <div className="text-5xl mb-2">📚</div>
                <p className="text-gray-600 text-sm mb-1">القصص</p>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-secondary">{analytics?.total_stories || 0}</p>
                )}
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="text-center relative z-20" elevation="sm">
                <div className="text-5xl mb-2">📊</div>
                <p className="text-gray-600 text-sm mb-1">النشاط اليومي</p>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-8 w-12 mx-auto rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-primary">{analytics?.daily_activity || 0}</p>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center relative z-20"
                onClick={() => router.push('/admin/teachers')}
              >
                <div className="flex justify-center mb-3">
                  <Users className="w-16 h-16 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">إدارة المعلمين</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  إنشاء وإدارة حسابات المعلمين
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center relative z-20"
                onClick={() => router.push('/admin/permissions')}
              >
                <div className="flex justify-center mb-3">
                  <Shield className="w-16 h-16 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">الأذونات</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  إدارة أذونات وصول المعلمين
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center relative z-20"
                onClick={() => router.push('/admin/analytics')}
              >
                <div className="flex justify-center mb-3">
                  <BarChart3 className="w-16 h-16 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">التحليلات</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  عرض إحصائيات النظام الشاملة
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center relative z-20"
                onClick={() => router.push('/admin/grades')}
              >
                <div className="flex justify-center mb-3">
                  <GraduationCap className="w-16 h-16 text-accent-green" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">إدارة الصفوف</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  إدارة الصفوف الدراسية والمعلمين
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center"
                onClick={() => toast('قريباً جداً...')}
              >
                <div className="text-5xl mb-3">⚙️</div>
                <h3 className="text-xl font-bold text-ink mb-2">الإعدادات</h3>
                <p className="text-gray-600 text-sm">
                  تكوين إعدادات النظام الشاملة
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center"
                onClick={() => toast('قريباً جداً...')}
              >
                <div className="text-5xl mb-3">📋</div>
                <h3 className="text-xl font-bold text-ink mb-2">التقارير</h3>
                <p className="text-gray-600 text-sm">
                  إنشاء تقارير شاملة وتحليلات
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card
              className="bg-gradient-to-r from-primary/20 to-secondary/20 text-center py-8"
              elevation="md"
            >
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-2xl font-bold text-ink mb-2">
                أدوات الإدارة قيد التطوير
              </h3>
              <p className="text-gray-600 mb-4">
                نحن نعمل على تطوير أدوات إدارة متقدمة ومتكاملة للنظام
              </p>
              <Button size="lg" variant="primary" disabled>
                قريباً جداً
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedBackground>
  )
}
