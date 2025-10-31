'use client'

import React, { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { adminService, supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { 
  Users, 
  ArrowLeft, 
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Shield,
  GraduationCap,
  Calendar,
  Activity
} from 'lucide-react'

interface Teacher {
  id: string
  name: string
  access_code: string
  assigned_grade: number
  permission_level: string
  created_at: string
  last_login_at?: string
  is_active: boolean
}

export default function AdminTeacherManagement() {
  const router = useRouter()
  const { user, userRole } = useAppStore()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    assigned_grade: 3,
    permission_level: 'full_access'
  })

  useEffect(() => {
    if (userRole !== 'admin') {
      router.push('/')
      return
    }
    loadTeachers()
  }, [userRole, router])

  const loadTeachers = async () => {
    try {
      setIsLoading(true)
      
      // Use adminService to ensure proper authentication context
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeachers(data || [])
    } catch (error) {
      console.error('Error loading teachers:', error)
      toast.error('فشل تحميل قائمة المعلمين')
    } finally {
      setIsLoading(false)
    }
  }

  const generateAccessCode = () => {
    const grade = newTeacher.assigned_grade
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `TEACH${grade}A${new Date().getFullYear()}${random}`
  }

  const createTeacher = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTeacher.name.trim()) {
      toast.error('الرجاء إدخال اسم المعلم')
      return
    }

    try {
      setIsCreating(true)

      const accessCode = generateAccessCode()

      const teacherData = {
        name: newTeacher.name,
        access_code: accessCode,
        assigned_grade: newTeacher.assigned_grade,
        permission_level: newTeacher.permission_level,
        created_at: new Date().toISOString(),
        is_active: true,
      }

      await adminService.createTeacher(teacherData)

      toast.success('تم إنشاء حساب المعلم بنجاح! 🎉')
      setShowCreateForm(false)
      setNewTeacher({ name: '', assigned_grade: 3, permission_level: 'full_access' })
      loadTeachers()
    } catch (error) {
      console.error('Error creating teacher:', error)
      toast.error('فشل إنشاء حساب المعلم')
    } finally {
      setIsCreating(false)
    }
  }

  const copyAccessCode = async (accessCode: string) => {
    try {
      await navigator.clipboard.writeText(accessCode)
      toast.success('تم نسخ رمز الوصول!')
    } catch (error) {
      toast.error('فشل نسخ رمز الوصول')
    }
  }

  const toggleTeacherStatus = async (teacherId: string, currentStatus: boolean) => {
    try {
      await adminService.updateTeacher(teacherId, { is_active: !currentStatus })

      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} حساب المعلم`)
      loadTeachers()
    } catch (error) {
      console.error('Error updating teacher status:', error)
      toast.error('فشل تحديث حالة المعلم')
    }
  }

  const deleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المعلم "${teacherName}"؟`)) {
      return
    }

    try {
      await adminService.deleteTeacher(teacherId)

      toast.success('تم حذف المعلم بنجاح')
      loadTeachers()
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error('فشل حذف المعلم')
    }
  }

  if (userRole !== 'admin') {
    return null
  }

  return (
    <AnimatedBackground>
      <Toaster position="top-center" />
      <div className="w-full min-h-screen p-4 md:p-6" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-2 md:gap-3">
                <Users className="w-8 h-8 md:w-10 md:h-10 text-primary flex-shrink-0" />
                إدارة المعلمين
              </h1>
              <p className="text-gray-300 text-sm md:text-lg font-semibold">
                إدارة حسابات المعلمين والصلاحيات
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="primary"
                size="sm"
                className="flex-1 md:flex-none"
                icon={<Plus className="w-4 h-4 md:w-5 md:h-5" />}
              >
                إضافة معلم
              </Button>
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />}
              >
                العودة
              </Button>
            </div>
          </div>

          {/* Create Teacher Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card>
                <h3 className="text-2xl font-bold text-white mb-6">إضافة معلم جديد</h3>
                <form onSubmit={createTeacher}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        اسم المعلم
                      </label>
                        <input
                          type="text"
                          value={newTeacher.name}
                          onChange={(e) =>
                            setNewTeacher({ ...newTeacher, name: e.target.value })
                          }
                        placeholder="مثال: معلمة الصف الثالث"
                        className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                        disabled={isCreating}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        الصف الدراسي
                      </label>
                      <select
                        value={newTeacher.assigned_grade}
                        onChange={(e) =>
                          setNewTeacher({ ...newTeacher, assigned_grade: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                        disabled={isCreating}
                      >
                        <option value={1}>الصف الأول</option>
                        <option value={2}>الصف الثاني</option>
                        <option value={3}>الصف الثالث</option>
                        <option value={4}>الصف الرابع</option>
                        <option value={5}>الصف الخامس</option>
                        <option value={6}>الصف السادس</option>
                        <option value={7}>الصف السابع</option>
                        <option value={8}>الصف الثامن</option>
                        <option value={9}>الصف التاسع</option>
                        <option value={10}>الصف العاشر</option>
                        <option value={11}>الصف الحادي عشر</option>
                        <option value={12}>الصف الثاني عشر</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        مستوى الصلاحية
                      </label>
                      <select
                        value={newTeacher.permission_level}
                        onChange={(e) =>
                          setNewTeacher({ ...newTeacher, permission_level: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white font-semibold"
                        disabled={isCreating}
                      >
                        <option value="full_access">صلاحية كاملة</option>
                        <option value="limited_access">صلاحية محدودة</option>
                        <option value="read_only">قراءة فقط</option>
                        <option value="no_access">بدون صلاحية</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isCreating}
                      disabled={isCreating}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      {isCreating ? 'جاري الإنشاء...' : 'إنشاء المعلم'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      variant="ghost"
                      size="md"
                      disabled={isCreating}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* Teachers List */}
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">قائمة المعلمين</h2>
              <div className="text-gray-300 text-sm md:text-base font-semibold">
                إجمالي المعلمين: {teachers.length}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-spin">⏳</div>
                <p className="text-xl text-gray-400">جاري التحميل...</p>
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">لا يوجد معلمون</h3>
                <p className="text-gray-400">ابدأ بإضافة معلم جديد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teachers.map((teacher, index) => (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 md:p-6 rounded-lg border-2 transition-all ${
                      teacher.is_active
                        ? 'border-slate-700 bg-slate-800/50'
                        : 'border-red-500/50 bg-red-900/20'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                          <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                          <h3 className="text-base md:text-xl font-bold text-white truncate">
                            {teacher.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs md:text-sm font-bold flex-shrink-0 ${
                            teacher.is_active
                              ? 'bg-accent-green text-white'
                              : 'bg-accent-red text-white'
                          }`}>
                            {teacher.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">الصلاحية:</span>
                            <span className="text-white font-semibold">
                              {teacher.permission_level === 'full_access' ? 'كاملة' :
                               teacher.permission_level === 'limited_access' ? 'محدودة' :
                               teacher.permission_level === 'read_only' ? 'قراءة فقط' : 'بدون صلاحية'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">الصف:</span>
                            <span className="text-white font-semibold">
                              الصف {teacher.assigned_grade}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">آخر دخول:</span>
                            <span className="text-white font-semibold text-xs md:text-sm">
                              {teacher.last_login_at
                                ? new Date(teacher.last_login_at).toLocaleString('ar-SA', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  })
                                : 'لم يسجل دخول'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 md:mt-4 p-2 md:p-3 bg-slate-900 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-400 text-xs md:text-sm font-semibold">رمز الوصول:</span>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto">
                            <code className="bg-slate-800 px-2 md:px-3 py-1 md:py-2 rounded text-primary font-mono text-sm md:text-lg">
                              {teacher.access_code}
                            </code>
                            <Button
                              onClick={() => copyAccessCode(teacher.access_code)}
                              variant="ghost"
                              size="sm"
                              icon={<Copy className="w-4 h-4" />}
                            >
                              نسخ
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-2">
                        <Button
                          onClick={() => toggleTeacherStatus(teacher.id, teacher.is_active)}
                          variant={teacher.is_active ? 'secondary' : 'primary'}
                          size="sm"
                          className="flex-1 md:flex-none"
                          icon={teacher.is_active ? <Eye className="w-3 h-3 md:w-4 md:h-4" /> : <Activity className="w-3 h-3 md:w-4 md:h-4" />}
                        >
                          <span className="text-xs md:text-sm">
                            {teacher.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                          </span>
                        </Button>
                        <Button
                          onClick={() => deleteTeacher(teacher.id, teacher.name)}
                          variant="ghost"
                          size="sm"
                          className="flex-1 md:flex-none"
                          icon={<Trash2 className="w-3 h-3 md:w-4 md:h-4" />}
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
      </div>
    </AnimatedBackground>
  )
}
