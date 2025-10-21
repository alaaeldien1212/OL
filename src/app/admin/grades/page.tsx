'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import Button from '@/components/Button'
import Card from '@/components/Card'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Trash2, 
  Edit, 
  GraduationCap, 
  Users, 
  BookOpen,
  Save,
  X
} from 'lucide-react'

interface Grade {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
}

interface GradeStats {
  grade: number
  teachers_count: number
  students_count: number
  stories_count: number
}

export default function GradeManagement() {
  const router = useRouter()
  const { user, userRole } = useAppStore()
  const [grades, setGrades] = useState<Grade[]>([])
  const [gradeStats, setGradeStats] = useState<GradeStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [newGrade, setNewGrade] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (userRole !== 'admin') {
      router.push('/')
      return
    }
    loadGrades()
  }, [userRole, router])

  const loadGrades = async () => {
    try {
      setIsLoading(true)
      
      // Load grade statistics
      const { data: stats } = await supabase.rpc('get_grade_statistics')
      setGradeStats(stats || [])

      // Create grades array from stats
      const gradesData = stats?.map((stat: GradeStats) => ({
        id: stat.grade,
        name: `الصف ${stat.grade}`,
        description: `الصف الدراسي ${stat.grade}`,
        is_active: true,
        created_at: new Date().toISOString()
      })) || []

      setGrades(gradesData)
    } catch (error) {
      console.error('Error loading grades:', error)
      toast.error('فشل تحميل الصفوف')
    } finally {
      setIsLoading(false)
    }
  }

  const createGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newGrade.name.trim()) {
      toast.error('الرجاء إدخال اسم الصف')
      return
    }

    try {
      // Extract grade number from name
      const gradeNumber = parseInt(newGrade.name.replace(/\D/g, ''))
      
      if (isNaN(gradeNumber) || gradeNumber < 1 || gradeNumber > 12) {
        toast.error('الرجاء إدخال رقم صف صحيح (1-12)')
        return
      }

      // Check if grade already exists
      const existingGrade = grades.find(g => g.id === gradeNumber)
      if (existingGrade) {
        toast.error('هذا الصف موجود بالفعل')
        return
      }

      // Create classroom record
      const { error } = await supabase
        .from('classrooms')
        .insert({
          grade: gradeNumber,
          name: newGrade.name,
          description_arabic: newGrade.description,
          is_active: true,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('تم إنشاء الصف بنجاح! 🎉')
      setShowCreateForm(false)
      setNewGrade({ name: '', description: '' })
      loadGrades()
    } catch (error: any) {
      console.error('Error creating grade:', error)
      toast.error('فشل إنشاء الصف')
    }
  }

  const deleteGrade = async (gradeId: number, gradeName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الصف "${gradeName}"؟\nسيتم حذف جميع البيانات المرتبطة بهذا الصف.`)) {
      return
    }

    try {
      // Delete classroom
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('grade', gradeId)

      if (error) throw error

      toast.success('تم حذف الصف بنجاح!')
      loadGrades()
    } catch (error: any) {
      console.error('Error deleting grade:', error)
      toast.error('فشل حذف الصف')
    }
  }

  const toggleGradeStatus = async (gradeId: number, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .update({ is_active: !isActive })
        .eq('grade', gradeId)

      if (error) throw error

      toast.success(`تم ${!isActive ? 'تفعيل' : 'إلغاء تفعيل'} الصف بنجاح!`)
      loadGrades()
    } catch (error: any) {
      console.error('Error toggling grade status:', error)
      toast.error('فشل تحديث حالة الصف')
    }
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">غير مصرح لك بالوصول</h2>
          <p className="text-gray-300 mb-6">هذه الصفحة متاحة للمسؤولين فقط</p>
          <Button onClick={() => router.push('/')} variant="primary">
            العودة للرئيسية
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cloud p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">إدارة الصفوف الدراسية</h1>
            <p className="text-gray-300">إدارة الصفوف والمعلمين والطلاب</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="primary"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
          >
            إضافة صف جديد
          </Button>
        </div>

        {/* Create Grade Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">إضافة صف جديد</h3>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-4 h-4" />}
                >
                  إلغاء
                </Button>
              </div>

              <form onSubmit={createGrade} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2">
                      اسم الصف
                    </label>
                    <input
                      type="text"
                      value={newGrade.name}
                      onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                      placeholder="مثال: الصف الأول"
                      className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-2">
                      الوصف (اختياري)
                    </label>
                    <input
                      type="text"
                      value={newGrade.description}
                      onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                      placeholder="وصف الصف"
                      className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={<Save className="w-5 h-5" />}
                  >
                    إنشاء الصف
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => setShowCreateForm(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Grades List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-300 mt-4">جاري تحميل الصفوف...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grades.map((grade, index) => {
              const stats = gradeStats.find(s => s.grade === grade.id)
              
              return (
                <motion.div
                  key={grade.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-hover transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="text-xl font-bold text-white">{grade.name}</h3>
                          <p className="text-gray-300 text-sm">{grade.description}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        grade.is_active
                          ? 'bg-accent-green text-white'
                          : 'bg-accent-red text-white'
                      }`}>
                        {grade.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <Users className="w-6 h-6 text-secondary mx-auto mb-2" />
                        <div className="text-lg font-bold text-white">{stats?.teachers_count || 0}</div>
                        <div className="text-xs text-gray-400">معلم</div>
                      </div>
                      <div className="text-center">
                        <Users className="w-6 h-6 text-accent-green mx-auto mb-2" />
                        <div className="text-lg font-bold text-white">{stats?.students_count || 0}</div>
                        <div className="text-xs text-gray-400">طالب</div>
                      </div>
                      <div className="text-center">
                        <BookOpen className="w-6 h-6 text-accent-red mx-auto mb-2" />
                        <div className="text-lg font-bold text-white">{stats?.stories_count || 0}</div>
                        <div className="text-xs text-gray-400">قصة</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => toggleGradeStatus(grade.id, grade.is_active)}
                        variant={grade.is_active ? "ghost" : "success"}
                        size="sm"
                        className="flex-1"
                      >
                        {grade.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                      </Button>
                      <Button
                        onClick={() => deleteGrade(grade.id, grade.name)}
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        حذف
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {grades.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">لا توجد صفوف بعد</h3>
            <p className="text-gray-300 mb-6">ابدأ بإنشاء صف جديد لإدارة المعلمين والطلاب</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="primary"
              size="lg"
              icon={<Plus className="w-5 h-5" />}
            >
              إضافة صف جديد
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
