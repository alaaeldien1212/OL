'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import toast, { Toaster } from 'react-hot-toast'
import { Users, BookOpen, FileText, Star, BarChart3, Trophy, GraduationCap, LogOut } from 'lucide-react'
import { showPageLoader } from '@/components/PageTransitionLoader'

export default function TeacherDashboard() {
  const router = useRouter()
  const { user, userRole, isAuthenticated, hydrated } = useAppStore()

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || userRole !== 'teacher') {
      router.replace('/')
      return
    }
  }, [hydrated, isAuthenticated, userRole, router])

  const handleLogout = () => {
    const { logout } = useAppStore.getState()
    logout()
    showPageLoader()
    router.push('/')
  }

  const teacherName = (user as any)?.name || 'معلم'

  return (
    <AnimatedBackground>
      <Toaster position="top-center" />
      <div className="w-full min-h-screen p-4 md:p-6" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <GraduationCap className="w-10 h-10" />
                لوحة تحكم المعلم
              </h1>
              <p className="text-gray-300 text-lg font-semibold">مرحبا {teacherName}</p>
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

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center"
                onClick={() => {
                  showPageLoader()
                  router.push('/teacher/students')
                }}
              >
                <div className="flex justify-center mb-3">
                  <Users className="w-16 h-16 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">إدارة الطلاب</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  إنشاء وإدارة أكواد وصول الطلاب
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center"
                onClick={() => {
                  showPageLoader()
                  router.push('/teacher/stories')
                }}
              >
                <div className="flex justify-center mb-3">
                  <BookOpen className="w-16 h-16 text-accent-green" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">إدارة القصص</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  إنشاء وتعديل وحذف القصص
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center"
                onClick={() => {
                  showPageLoader()
                  router.push('/teacher/forms')
                }}
              >
                <div className="flex justify-center mb-3">
                  <FileText className="w-16 h-16 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">إدارة النماذج</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  إنشاء وتعديل وحذف النماذج والأسئلة
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card
                className="cursor-pointer hover:shadow-hover transition-all p-6 text-center"
                onClick={() => {
                  showPageLoader()
                  router.push('/teacher/grading')
                }}
              >
                <div className="flex justify-center mb-3">
                  <Star className="w-16 h-16 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">الإجابات</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  تقييم وتصحيح إجابات الطلاب
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
                onClick={() => {
                  showPageLoader()
                  router.push('/teacher/analytics')
                }}
              >
                <div className="flex justify-center mb-3">
                  <BarChart3 className="w-16 h-16 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">التحليلات</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  عرض إحصائيات وتقدم الفصل
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
                onClick={() => {
                  showPageLoader()
                  router.push('/leaderboard')
                }}
              >
                <div className="flex justify-center mb-3">
                  <Trophy className="w-16 h-16 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">جدول الترتيب</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  عرض ترتيب الطلاب والإنجازات
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card
              className="bg-gradient-to-r from-primary/20 to-secondary/20 text-center py-8"
              elevation="md"
            >
              <div className="flex justify-center mb-4">
                <GraduationCap className="w-20 h-20 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                أدوات المعلم قيد التطوير
              </h3>
              <p className="text-gray-200 mb-4 font-semibold">
                نحن نعمل على إضافة جميع الميزات التي تحتاجونها قريباً جداً!
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
