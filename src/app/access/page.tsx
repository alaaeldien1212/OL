'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { authService } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { Shield, GraduationCap, LogIn, UserCheck, X, ArrowRight } from 'lucide-react'
import { showPageLoader } from '@/components/PageTransitionLoader'

export default function AccessPortalPage() {
  const router = useRouter()
  const { setUser, setError, setLoading } = useAppStore()
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginType, setLoginType] = useState<'admin' | 'teacher'>('admin')
  const [accessCode, setAccessCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoading(true)

    try {
      const result = await authService.loginWithAccessCode(accessCode)
      setUser(result.user, result.type)
      
      if (result.type === 'admin') {
        toast.success('مرحباً أيها المسؤول! 👨‍💼')
        showPageLoader()
        router.push('/admin')
      } else if (result.type === 'teacher') {
        toast.success(`مرحباً ${result.user.name}! 👩‍🏫`)
        showPageLoader()
        router.push('/teacher')
      } else {
        toast.error('رمز الدخول غير صحيح')
        setIsLoading(false)
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message)
      toast.error(error.message)
      setIsLoading(false)
      setLoading(false)
    }
  }

  return (
    <AnimatedBackground>
      <Toaster position="top-center" />
      <div className="w-full min-h-screen flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="flex flex-col items-center gap-2 mb-4">
              <img 
                src="/logow.png" 
                alt="البيان" 
                className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
              />
              <h1 className="text-3xl md:text-5xl font-bold text-white">
                بوابة الإدارة
              </h1>
            </div>
            <p className="text-gray-300 text-lg">
              دخول المسؤولين والمعلمين
            </p>
          </motion.div>

          {/* Login Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          >
            {/* Admin Login */}
            <Card className="p-6 md:p-8 text-center hover:scale-105 transition-transform duration-200">
              <Shield className="w-16 h-16 md:w-20 md:h-20 text-primary mx-auto mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">دخول المسؤول</h3>
              <p className="text-gray-300 mb-4 text-base">إدارة النظام والمعلمين</p>
              <Button
                onClick={() => {
                  setLoginType('admin')
                  setShowLoginForm(true)
                }}
                variant="primary"
                size="lg"
                className="w-full text-lg"
                icon={<LogIn className="w-5 h-5" />}
              >
                دخول المسؤول
              </Button>
            </Card>

            {/* Teacher Login */}
            <Card className="p-6 md:p-8 text-center hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-16 h-16 md:w-20 md:h-20 text-secondary mx-auto mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">دخول المعلم</h3>
              <p className="text-gray-300 mb-4 text-base">إدارة الطلاب والقصص</p>
              <Button
                onClick={() => {
                  setLoginType('teacher')
                  setShowLoginForm(true)
                }}
                variant="secondary"
                size="lg"
                className="w-full text-lg"
                icon={<UserCheck className="w-5 h-5" />}
              >
                دخول المعلم
              </Button>
            </Card>
          </motion.div>

          {/* Back to Home Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <Button
              onClick={() => {
                showPageLoader()
                router.push('/')
              }}
              variant="ghost"
              size="md"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              العودة للصفحة الرئيسية
            </Button>
          </motion.div>

          {/* Login Form Modal */}
          {showLoginForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowLoginForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-xl p-6 md:p-8 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {loginType === 'admin' ? (
                      <>
                        <Shield className="w-8 h-8 text-primary" />
                        <h2 className="text-2xl font-bold text-white">دخول المسؤول</h2>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-8 h-8 text-secondary" />
                        <h2 className="text-2xl font-bold text-white">دخول المعلم</h2>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setShowLoginForm(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-2 text-lg">
                      رمز الدخول
                    </label>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-slate-900 text-white font-mono text-lg"
                      placeholder="أدخل رمز الدخول"
                      maxLength={16}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="flex-1 text-lg"
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      {isLoading ? 'جاري الدخول...' : 'دخول'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowLoginForm(false)}
                      variant="ghost"
                      size="lg"
                      disabled={isLoading}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatedBackground>
  )
}

