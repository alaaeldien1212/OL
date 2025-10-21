'use client'

import React from 'react'

export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import toast, { Toaster } from 'react-hot-toast'

export default function StudentProfile() {
  const router = useRouter()
  const { user, isAuthenticated } = useAppStore()

  if (!isAuthenticated) {
    router.push('/')
    return null
  }

  const studentName = (user as any)?.name || 'طالب'

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
              <div className="text-8xl mb-4 inline-block">👑</div>
              <h2 className="text-3xl font-bold text-ink mb-2">{studentName}</h2>
              <p className="text-gray-600 mb-4">قارئ مبتدئ</p>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">5</div>
                  <p className="text-gray-600 text-sm">قصص مقروءة</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-accent-green">3</div>
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
              {[
                { icon: '📖', title: 'قارئ مبتدئ', earned: true },
                { icon: '⭐', title: 'قارئ نشيط', earned: false },
                { icon: '🌟', title: 'قارئ متميز', earned: false },
                { icon: '🏅', title: 'قارئ محترف', earned: false },
                { icon: '🏆', title: 'قارئ بطل', earned: false },
                { icon: '👑', title: 'قارئ أسطوري', earned: false },
              ].map((achievement, i) => (
                <motion.div
                  key={i}
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
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <p className="text-sm font-bold">{achievement.title}</p>
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
            <h3 className="text-2xl font-bold text-ink mb-4">📊 إحصائياتك</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">القصص المقروءة</span>
                  <span className="text-3xl font-bold text-primary">5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: '50%' }}
                  />
                </div>
              </Card>

              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">النماذج المرسلة</span>
                  <span className="text-3xl font-bold text-accent-green">3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-accent-green h-2 rounded-full"
                    style={{ width: '30%' }}
                  />
                </div>
              </Card>

              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">وقت القراءة الإجمالي</span>
                  <span className="text-3xl font-bold text-secondary">2س 30د</span>
                </div>
                <p className="text-xs text-gray-500">رائع! استمر في القراءة</p>
              </Card>

              <Card elevation="sm" padding="lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">الدرجة الحالية</span>
                  <span className="text-3xl font-bold text-accent-red">85%</span>
                </div>
                <p className="text-xs text-gray-500">أداء ممتاز!</p>
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
                {[
                  { action: 'قرأت القصة: القط الصغير والفراشة', date: 'اليوم' },
                  { action: 'أرسلت نموذج التحليل', date: 'اليوم' },
                  { action: 'أكملت سلسلة من 3 قصص', date: 'أمس' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-3 border-b last:border-0 last:pb-0">
                    <span className="text-gray-600">{item.action}</span>
                    <span className="text-sm text-gray-500">{item.date}</span>
                  </div>
                ))}
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
