'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { BookOpen, Save, ArrowLeft, FileText } from 'lucide-react'

export default function CreateStory() {
  const router = useRouter()
  const { user, userRole } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [story, setStory] = useState({
    title_arabic: '',
    content_arabic: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    grade_level: 3,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!story.title_arabic.trim()) {
      toast.error('الرجاء إدخال عنوان القصة')
      return
    }

    if (!story.content_arabic.trim()) {
      toast.error('الرجاء إدخال محتوى القصة')
      return
    }

    if (story.content_arabic.length < 100) {
      toast.error('القصة قصيرة جداً! اكتب على الأقل 100 حرف')
      return
    }

    try {
      setIsSubmitting(true)

      const teacherData = user as any

      // Use the new teacher_create_story function
      const { data, error } = await supabase.rpc('teacher_create_story', {
        story_title: story.title_arabic,
        story_content: story.content_arabic,
        story_difficulty: story.difficulty,
        story_grade: story.grade_level,
        teacher_access_code: teacherData.access_code
      })

      if (error) {
        console.error('Error creating story:', error)
        toast.error(`فشل إنشاء القصة: ${error.message}`)
        return
      }

      toast.success('تم إنشاء القصة بنجاح! 🎉')
      
      setTimeout(() => {
        router.push('/teacher')
      }, 1500)
    } catch (error) {
      console.error('Error creating story:', error)
      toast.error('فشل إنشاء القصة')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (userRole !== 'teacher') {
    router.push('/')
    return null
  }

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
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <BookOpen className="w-10 h-10 text-accent-green" />
                إنشاء قصة جديدة
              </h1>
              <p className="text-gray-300 text-lg font-semibold">
                اكتب قصة ملهمة للطلاب
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

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Title */}
              <Card>
                <label className="block text-white font-bold text-xl mb-3">
                  <FileText className="w-6 h-6 inline-block ml-2" />
                  عنوان القصة
                </label>
                <input
                  type="text"
                  value={story.title_arabic}
                  onChange={(e) =>
                    setStory({ ...story, title_arabic: e.target.value })
                  }
                  placeholder="مثال: القط الشجاع"
                  className="w-full px-4 py-3 text-lg border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                  disabled={isSubmitting}
                  required
                />
              </Card>

              {/* Difficulty & Grade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <label className="block text-white font-bold text-xl mb-3">
                    مستوى الصعوبة
                  </label>
                  <select
                    value={story.difficulty}
                    onChange={(e) =>
                      setStory({
                        ...story,
                        difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                      })
                    }
                    className="w-full px-4 py-3 text-lg border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                    disabled={isSubmitting}
                  >
                    <option value="easy">سهل 🟢</option>
                    <option value="medium">متوسط 🟡</option>
                    <option value="hard">صعب 🔴</option>
                  </select>
                </Card>

                <Card>
                  <label className="block text-white font-bold text-xl mb-3">
                    الصف الدراسي
                  </label>
                  <select
                    value={story.grade_level}
                    onChange={(e) =>
                      setStory({ ...story, grade_level: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 text-lg border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                    disabled={isSubmitting}
                  >
                    <option value={3}>الصف الثالث</option>
                    <option value={4}>الصف الرابع</option>
                    <option value={5}>الصف الخامس</option>
                    <option value={6}>الصف السادس</option>
                  </select>
                </Card>
              </div>

              {/* Content */}
              <Card>
                <label className="block text-white font-bold text-xl mb-3">
                  محتوى القصة
                </label>
                <textarea
                  value={story.content_arabic}
                  onChange={(e) =>
                    setStory({ ...story, content_arabic: e.target.value })
                  }
                  placeholder="اكتب قصة رائعة هنا... (100 حرف على الأقل)"
                  rows={15}
                  className="w-full px-4 py-3 text-lg border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white leading-relaxed font-semibold resize-none"
                  disabled={isSubmitting}
                  required
                />
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-400">
                    عدد الأحرف: {story.content_arabic.length}
                  </span>
                  <span
                    className={
                      story.content_arabic.length >= 100
                        ? 'text-accent-green font-bold'
                        : 'text-gray-400'
                    }
                  >
                    {story.content_arabic.length >= 100 ? '✓ جاهز' : 'الحد الأدنى: 100'}
                  </span>
                </div>
              </Card>

              {/* Preview */}
              {story.title_arabic && story.content_arabic && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      معاينة القصة
                    </h3>
                    <div className="bg-slate-900 p-6 rounded-lg">
                      <h4 className="text-2xl font-bold text-white mb-4">
                        {story.title_arabic}
                      </h4>
                      <div className="flex gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            story.difficulty === 'easy'
                              ? 'bg-accent-green text-white'
                              : story.difficulty === 'medium'
                              ? 'bg-secondary text-ink'
                              : 'bg-accent-red text-white'
                          }`}
                        >
                          {story.difficulty === 'easy'
                            ? 'سهل'
                            : story.difficulty === 'medium'
                            ? 'متوسط'
                            : 'صعب'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-primary text-white">
                          الصف {story.grade_level}
                        </span>
                      </div>
                      <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap font-semibold">
                        {story.content_arabic}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  icon={<Save className="w-5 h-5" />}
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'نشر القصة'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatedBackground>
  )
}

