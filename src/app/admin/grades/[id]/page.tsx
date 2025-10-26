'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import Button from '@/components/Button'
import Card from '@/components/Card'
import toast from 'react-hot-toast'
import { 
  BookOpen, 
  FileText, 
  ArrowLeft,
  User,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  AlertTriangle
} from 'lucide-react'

interface Story {
  id: string
  title_arabic: string
  content_arabic: string
  difficulty: string
  created_at: string
  author_name?: string
}

interface Form {
  id: string
  title_arabic: string
  description_arabic: string
  created_at: string
  story_id: string
  story_title?: string
  author_name?: string
  question_count: number
}

export default function GradeDetails() {
  const router = useRouter()
  const params = useParams()
  const { user, userRole } = useAppStore()
  const gradeId = params.id as string
  const [stories, setStories] = useState<Story[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewingStory, setViewingStory] = useState<Story | null>(null)
  const [viewingForm, setViewingForm] = useState<Form | null>(null)

  useEffect(() => {
    if (userRole !== 'admin') {
      router.push('/')
      return
    }
    loadGradeData()
  }, [userRole, router, gradeId])

  const loadGradeData = async () => {
    try {
      setIsLoading(true)
      const gradeNum = parseInt(gradeId)

      // Load stories for this grade using RPC
      const { data: storiesData, error: storiesError } = await supabase.rpc('admin_get_grade_stories', {
        grade_num: gradeNum
      })

      console.log('Stories query result:', { data: storiesData, error: storiesError, gradeNum })

      if (!storiesError && storiesData) {
        setStories(storiesData as Story[])
      }

      // Load forms for this grade using RPC
      const { data: formsData, error: formsError } = await supabase.rpc('admin_get_grade_forms', {
        grade_num: gradeNum
      })
      
      console.log('Forms query result:', { data: formsData, error: formsError, count: formsData?.length })

      if (!formsError && formsData) {
        setForms(formsData as Form[])
      }
    } catch (error) {
      console.error('Error loading grade data:', error)
      toast.error('فشل تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteStory = async (storyId: string, storyTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف القصة "${storyTitle}"؟`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (error) throw error

      toast.success('تم حذف القصة بنجاح!')
      loadGradeData()
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error('فشل حذف القصة')
    }
  }

  const deleteForm = async (formId: string, formTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف النموذج "${formTitle}"؟`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', formId)

      if (error) throw error

      toast.success('تم حذف النموذج بنجاح!')
      loadGradeData()
    } catch (error) {
      console.error('Error deleting form:', error)
      toast.error('فشل حذف النموذج')
    }
  }

  const deleteGrade = async () => {
    if (!confirm(`هل أنت متأكد من حذف الصف ${gradeId} بشكل كامل؟\nسيتم حذف جميع القصص والنماذج المرتبطة بهذا الصف.`)) {
      return
    }

    try {
      // Delete stories for this grade
      const { error: storiesError } = await supabase
        .from('stories')
        .delete()
        .eq('grade_level', parseInt(gradeId))

      if (storiesError) console.error('Error deleting stories:', storiesError)

      // Delete forms for this grade
      const { error: formsError } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', 'in', []) // Empty for now, we'll need to fetch forms first
      
      // Actually, let's get all stories first, then get their forms
      const { data: gradeStories } = await supabase
        .from('stories')
        .select('id')
        .eq('grade_level', parseInt(gradeId))

      if (gradeStories && gradeStories.length > 0) {
        const storyIds = gradeStories.map(s => s.id)
        await supabase
          .from('form_templates')
          .delete()
          .in('story_id', storyIds)
      }

      // Delete the grade itself
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', parseInt(gradeId))

      if (error) throw error

      toast.success('تم حذف الصف بنجاح!')
      router.push('/admin/grades')
    } catch (error) {
      console.error('Error deleting grade:', error)
      toast.error('فشل حذف الصف')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cloud flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-300 mt-4">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cloud p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">تفاصيل الصف {gradeId}</h1>
            <p className="text-gray-300 text-sm md:text-base">القصص والنماذج الخاصة بهذا الصف</p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <Button
              onClick={() => router.push('/admin/grades')}
              variant="ghost"
              size="sm"
              className="flex-1 md:flex-none"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              العودة
            </Button>
            <Button
              onClick={deleteGrade}
              variant="ghost"
              size="sm"
              className="flex-1 md:flex-none text-red-400 hover:text-red-300 hover:bg-red-500/20"
              icon={<AlertTriangle className="w-4 h-4" />}
            >
              حذف الصف
            </Button>
          </div>
        </div>

        {/* Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">القصص ({stories.length})</h2>
                  <p className="text-gray-300 text-sm md:text-base">جميع القصص المتاحة للصف {gradeId}</p>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/admin/grades/${gradeId}/create-story`)}
                variant="primary"
                size="sm"
                className="w-full md:w-auto"
                icon={<Plus className="w-4 h-4" />}
              >
                إضافة قصة
              </Button>
            </div>

            {stories.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">لا توجد قصص لهذا الصف</h3>
                <p className="text-gray-300">لم يتم إنشاء قصص بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800 p-3 md:p-4 rounded-lg border border-slate-700 hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-bold text-white mb-2">{story.title_arabic}</h3>
                        <p className="text-gray-300 text-xs md:text-sm mb-3 line-clamp-2">{story.content_arabic}</p>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            story.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                            story.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {story.difficulty === 'easy' ? 'سهل' : story.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate">{story.author_name}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="hidden md:inline">{new Date(story.created_at).toLocaleDateString('ar-SA')}</span>
                            <span className="md:hidden">{new Date(story.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric' })}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => setViewingStory(story)}
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                        >
                          عرض
                        </Button>
                        <Button
                          onClick={() => router.push(`/admin/grades/${gradeId}/edit-story/${story.id}`)}
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                        >
                          تعديل
                        </Button>
                        <Button
                          onClick={() => deleteStory(story.id, story.title_arabic)}
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Forms Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-secondary flex-shrink-0" />
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">نماذج الأسئلة ({forms.length})</h2>
                  <p className="text-gray-300 text-sm md:text-base">جميع نماذج الأسئلة للصف {gradeId}</p>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/admin/grades/${gradeId}/create-form`)}
                variant="secondary"
                size="sm"
                className="w-full md:w-auto"
                icon={<Plus className="w-4 h-4" />}
              >
                إضافة نموذج
              </Button>
            </div>

            {forms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">لا توجد نماذج لهذا الصف</h3>
                <p className="text-gray-300">لم يتم إنشاء نماذج بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {forms.map((form, index) => (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800 p-3 md:p-4 rounded-lg border border-slate-700 hover:border-secondary transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-bold text-white mb-2">{form.title_arabic}</h3>
                        <p className="text-gray-300 text-xs md:text-sm mb-3">{form.description_arabic}</p>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
                          <span className="flex items-center gap-1 truncate">
                            <BookOpen className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate">{form.story_title}</span>
                          </span>
                          <span className="text-primary font-bold">{form.question_count} سؤال</span>
                          <span className="flex items-center gap-1 truncate">
                            <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate">{form.author_name}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="hidden md:inline">{new Date(form.created_at).toLocaleDateString('ar-SA')}</span>
                            <span className="md:hidden">{new Date(form.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric' })}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => setViewingForm(form)}
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                        >
                          عرض
                        </Button>
                        <Button
                          onClick={() => router.push(`/admin/grades/${gradeId}/edit-form/${form.id}`)}
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                        >
                          تعديل
                        </Button>
                        <Button
                          onClick={() => deleteForm(form.id, form.title_arabic)}
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* View Story Modal */}
        {viewingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setViewingStory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{viewingStory.title_arabic}</h2>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-3 py-1 rounded-full font-semibold ${
                        viewingStory.difficulty === 'easy' ? 'bg-accent-green text-white' :
                        viewingStory.difficulty === 'medium' ? 'bg-secondary text-ink' : 'bg-accent-red text-white'
                      }`}>
                        {viewingStory.difficulty === 'easy' ? 'سهل' : viewingStory.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                      </span>
                      <span className="text-gray-300">الصف {gradeId}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setViewingStory(null)}
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4" />}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="prose prose-invert max-w-none">
                  <div className="text-white text-lg leading-lax font-arabic whitespace-pre-wrap">
                    {viewingStory.content_arabic}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* View Form Modal */}
        {viewingForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setViewingForm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="bg-gradient-to-r from-secondary/20 to-primary/20 p-6 border-b border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{viewingForm.title_arabic}</h2>
                    <p className="text-gray-300">{viewingForm.description_arabic}</p>
                    <div className="flex items-center gap-3 text-sm mt-2">
                      <span className="text-primary">القصة: {viewingForm.story_title}</span>
                      <span className="text-secondary">{viewingForm.question_count} سؤال</span>
                      <span className="text-gray-400">بواسطة: {viewingForm.author_name}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setViewingForm(null)}
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4" />}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="text-white">
                  <p className="text-lg mb-4">النموذج مكون من {viewingForm.question_count} سؤال</p>
                  <p className="text-gray-300">لمعرض الأسئلة، يرجى استخدام زر التعديل</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

