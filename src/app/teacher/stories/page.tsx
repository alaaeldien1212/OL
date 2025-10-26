'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { storiesService } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { 
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Calendar,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'

interface Story {
  id: string
  title_arabic: string
  content_arabic: string
  difficulty: 'easy' | 'medium' | 'hard'
  grade_level: number
  created_at: string
  is_active?: boolean
}

export default function TeacherStoriesPage() {
  const router = useRouter()
  const { user, isAuthenticated, userRole } = useAppStore()
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingStory, setEditingStory] = useState<Story | null>(null)
  const [viewingStory, setViewingStory] = useState<Story | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [isClosingEdit, setIsClosingEdit] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'teacher') {
      router.push('/')
      return
    }

    loadStories()
  }, [isAuthenticated, userRole, router])

  const loadStories = async () => {
    try {
      setIsLoading(true)
      
      const teacherData = user as any
      const teacherAccessCode = teacherData.access_code
      
      const storiesData = await storiesService.getTeacherStories(teacherAccessCode)
      setStories(storiesData || [])
    } catch (error) {
      console.error('Error loading stories:', error)
      toast.error('فشل تحميل القصص')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (story: Story) => {
    // If clicking on a different story while one is open, close and open new one
    if (showEditForm && editingStory && editingStory.id !== story.id) {
      setIsClosingEdit(true)
      setShowEditForm(false)
      setTimeout(() => {
        setEditingStory(story)
        setShowEditForm(true)
        setIsClosingEdit(false)
      }, 300)
    } else if (editingStory?.id === story.id) {
      // If clicking the same story, toggle the edit form
      setShowEditForm(false)
      setEditingStory(null)
    } else {
      // Open new edit form
      setEditingStory(story)
      setShowEditForm(true)
    }
  }

  const handleDelete = async (storyId: string, storyTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف القصة "${storyTitle}"؟\nسيتم حذف جميع البيانات المرتبطة بها.`)) {
      return
    }

    try {
      const teacherData = user as any
      const teacherAccessCode = teacherData.access_code
      
      await storiesService.deleteStory(teacherAccessCode, storyId)
      
      toast.success('تم حذف القصة بنجاح!')
      loadStories()
    } catch (error: any) {
      console.error('Error deleting story:', error)
      toast.error('فشل حذف القصة')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'from-green-500 to-green-600'
      case 'medium':
        return 'from-yellow-500 to-yellow-600'
      case 'hard':
        return 'from-red-500 to-red-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'سهل'
      case 'medium':
        return 'متوسط'
      case 'hard':
        return 'صعب'
      default:
        return difficulty
    }
  }

  return (
    <AnimatedBackground>
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-6"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <BookOpen className="w-6 h-6 md:w-10 md:h-10 text-primary" />
                قصصي
              </h1>
              <p className="text-gray-200 text-sm md:text-base">إدارة القصص التي قمت بإنشائها</p>
            </div>
            <div className="flex gap-2 md:gap-3 w-full md:w-auto">
              <Button
                onClick={() => router.push('/teacher/stories/create')}
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                size="sm"
                className="flex-1 md:flex-none"
              >
                <span className="hidden md:inline">قصة جديدة</span>
                <span className="md:hidden">جديدة</span>
              </Button>
              <Button
                onClick={() => router.push('/teacher')}
                variant="ghost"
                icon={<ArrowRight className="w-4 h-4" />}
                size="sm"
                className="flex-1 md:flex-none"
              >
                العودة
              </Button>
            </div>
          </motion.div>

          {/* Edit Form */}
          {showEditForm && editingStory && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card>
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h3 className="text-lg md:text-2xl font-bold text-white">تعديل القصة</h3>
                  <Button
                    onClick={() => {
                      setShowEditForm(false)
                      setEditingStory(null)
                    }}
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4" />}
                  >
                    <span className="hidden sm:inline">إلغاء</span>
                  </Button>
                </div>

                <EditStoryForm
                  story={editingStory}
                  onSuccess={() => {
                    setShowEditForm(false)
                    setEditingStory(null)
                    loadStories()
                  }}
                />
              </Card>
            </motion.div>
          )}

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
                <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 md:p-6 border-b border-slate-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg md:text-2xl font-bold text-white mb-2 truncate">{viewingStory.title_arabic}</h2>
                      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm flex-wrap">
                        <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full font-semibold text-xs ${
                          viewingStory.difficulty === 'easy' ? 'bg-accent-green text-white' :
                          viewingStory.difficulty === 'medium' ? 'bg-secondary text-ink' : 'bg-accent-red text-white'
                        }`}>
                          {getDifficultyText(viewingStory.difficulty)}
                        </span>
                        <span className="text-gray-300">الصف {viewingStory.grade_level}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setViewingStory(null)}
                      variant="ghost"
                      size="sm"
                      icon={<X className="w-4 h-4" />}
                      className="flex-shrink-0 ml-2"
                    >
                      <span className="hidden sm:inline">إغلاق</span>
                    </Button>
                  </div>
                </div>

                <div className="p-3 md:p-6 overflow-y-auto flex-1">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-white text-lg leading-lax font-arabic whitespace-pre-wrap">
                      {viewingStory.content_arabic}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Stories List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {isLoading ? (
              <Card>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-200">جاري التحميل...</p>
                </div>
              </Card>
            ) : stories.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد قصص حتى الآن</h3>
                  <p className="text-gray-200 mb-6">ابدأ بإنشاء قصة جديدة!</p>
                  <Button
                    onClick={() => router.push('/teacher/stories/create')}
                    variant="primary"
                    icon={<Plus className="w-5 h-5" />}
                  >
                    إنشاء قصة جديدة
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-all h-full flex flex-col">
                      {/* Story Header */}
                      <div className={`bg-gradient-to-r ${getDifficultyColor(story.difficulty)} p-3 md:p-4 rounded-t-lg -m-6 mb-4`}>
                        <h3 className="text-base md:text-xl font-bold text-white mb-1 line-clamp-2">{story.title_arabic}</h3>
                        <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                          <span className="bg-white/20 px-2 py-1 md:px-3 md:py-1 rounded-full text-white font-semibold text-xs">
                            {getDifficultyText(story.difficulty)}
                          </span>
                          <span className="text-white font-semibold">الصف {story.grade_level}</span>
                        </div>
                      </div>

                      {/* Story Content Preview */}
                      <div className="flex-1 mb-4">
                        <p className="text-gray-300 text-xs md:text-sm line-clamp-3">
                          {story.content_arabic.substring(0, 100)}...
                        </p>
                      </div>

                      {/* Story Info */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(story.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-slate-700">
                        <Button
                          onClick={() => setViewingStory(story)}
                          variant="success"
                          size="sm"
                          icon={<Eye className="w-3 h-3 md:w-4 md:h-4" />}
                          disabled={showEditForm || isClosingEdit}
                          className="flex-1 text-xs md:text-sm"
                        >
                          <span className="hidden sm:inline">عرض</span>
                          <span className="sm:hidden">👁️</span>
                        </Button>
                        <Button
                          onClick={() => handleEdit(story)}
                          variant="primary"
                          size="sm"
                          icon={<Edit className="w-3 h-3 md:w-4 md:h-4" />}
                          disabled={isClosingEdit}
                          className="flex-1 text-xs md:text-sm"
                        >
                          {editingStory?.id === story.id && showEditForm ? 'إغلاق' : 'تعديل'}
                        </Button>
                        <Button
                          onClick={() => handleDelete(story.id, story.title_arabic)}
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-3 h-3 md:w-4 md:h-4" />}
                          disabled={showEditForm && editingStory?.id !== story.id}
                          className="text-xs md:text-sm"
                        >
                          <span className="hidden sm:inline">حذف</span>
                          <span className="sm:hidden">🗑️</span>
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatedBackground>
  )
}

// Edit Story Form Component
function EditStoryForm({ story, onSuccess }: { story: Story; onSuccess: () => void }) {
  const router = useRouter()
  const { user } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title_arabic: story.title_arabic,
    content_arabic: story.content_arabic,
    difficulty: story.difficulty,
    grade_level: story.grade_level
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const teacherData = user as any
      const teacherAccessCode = teacherData.access_code
      
      await storiesService.updateStory(teacherAccessCode, story.id, formData)
      
      toast.success('تم تعديل القصة بنجاح! 🎉')
      onSuccess()
    } catch (error: any) {
      console.error('Error updating story:', error)
      toast.error('فشل تعديل القصة')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-300 font-semibold mb-2">العنوان</label>
        <input
          type="text"
          value={formData.title_arabic}
          onChange={(e) => setFormData({ ...formData, title_arabic: e.target.value })}
          className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
          required
        />
      </div>

      <div>
        <label className="block text-gray-300 font-semibold mb-2">المحتوى</label>
        <textarea
          value={formData.content_arabic}
          onChange={(e) => setFormData({ ...formData, content_arabic: e.target.value })}
          rows={8}
          className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">الصعوبة</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
            className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
            required
          >
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">صعب</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 font-semibold mb-2">الصف الدراسي</label>
          <input
            type="number"
            value={formData.grade_level}
            onChange={(e) => setFormData({ ...formData, grade_level: parseInt(e.target.value) })}
            min="1"
            max="12"
            className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold opacity-75 cursor-not-allowed"
            disabled={true}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="flex-1"
          isLoading={isSubmitting}
          icon={<FileText className="w-5 h-5" />}
        >
          حفظ التعديلات
        </Button>
      </div>
    </form>
  )
}

