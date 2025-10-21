'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'

interface Student {
  id: string
  name: string
  access_code: string
  classroom_id: string
  stories_read: number
  forms_submitted: number
  is_registered: boolean
  created_at: string
}

export default function StudentManagement() {
  const router = useRouter()
  const { user, userRole } = useAppStore()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (userRole !== 'teacher') {
      router.push('/')
      return
    }
    loadStudents()
  }, [userRole, router])

  const loadStudents = async () => {
    try {
      setIsLoading(true)
      const teacherData = user as any
      
      // Use the new teacher_get_students function
      const { data, error } = await supabase.rpc('teacher_get_students', {
        teacher_access_code: teacherData.access_code
      })

      if (error) {
        console.error('Error loading students:', error)
        toast.error(`فشل تحميل الطلاب: ${error.message}`)
        return
      }

      setStudents(data || [])
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('فشل تحميل الطلاب')
    } finally {
      setIsLoading(false)
    }
  }

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const createStudent = async () => {
    if (!newStudentName.trim()) {
      toast.error('الرجاء إدخال اسم الطالب')
      return
    }

    try {
      setIsCreating(true)
      const teacherData = user as any
      
      const accessCode = generateAccessCode()

      // Use the new teacher_create_student function
      const { data, error } = await supabase.rpc('teacher_create_student', {
        student_name: newStudentName,
        student_access_code: accessCode,
        teacher_access_code: teacherData.access_code
      })

      if (error) {
        console.error('Error creating student:', error)
        toast.error(`فشل إنشاء الطالب: ${error.message}`)
        return
      }

      toast.success('تم إنشاء الطالب بنجاح!')
      setNewStudentName('')
      setShowCreateModal(false)
      loadStudents()
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error('فشل إنشاء الطالب')
    } finally {
      setIsCreating(false)
    }
  }

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('تم نسخ رمز الوصول!')
  }

  const deleteStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (error) throw error
      toast.success('تم حذف الطالب')
      loadStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error('فشل حذف الطالب')
    }
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
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                إدارة الطلاب 👥
              </h1>
              <p className="text-gray-400 text-lg">إنشاء وإدارة حسابات الطلاب</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                size="lg"
              >
                ➕ إضافة طالب
              </Button>
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="lg"
              >
                العودة
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="text-center">
              <div className="text-5xl mb-2">👥</div>
              <p className="text-gray-400 text-sm mb-1">عدد الطلاب</p>
              <p className="text-3xl font-bold text-primary">{students.length}</p>
            </Card>
            <Card className="text-center">
              <div className="text-5xl mb-2">📖</div>
              <p className="text-gray-400 text-sm mb-1">مجموع القراءات</p>
              <p className="text-3xl font-bold text-accent-green">
                {students.reduce((sum, s) => sum + s.stories_read, 0)}
              </p>
            </Card>
            <Card className="text-center">
              <div className="text-5xl mb-2">✏️</div>
              <p className="text-gray-400 text-sm mb-1">مجموع النماذج</p>
              <p className="text-3xl font-bold text-secondary">
                {students.reduce((sum, s) => sum + s.forms_submitted, 0)}
              </p>
            </Card>
          </div>

          {/* Students List */}
          {isLoading ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4 animate-spin">⏳</div>
              <p className="text-xl text-gray-400">جاري التحميل...</p>
            </Card>
          ) : students.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-white mb-2">لا يوجد طلاب</h3>
              <p className="text-gray-400 mb-4">ابدأ بإضافة طلاب جدد</p>
              <Button onClick={() => setShowCreateModal(true)} size="lg">
                إضافة أول طالب
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          انضم: {new Date(student.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div className="text-3xl">👦</div>
                    </div>

                    {/* Access Code */}
                    <div className="bg-slate-900 p-3 rounded-lg mb-3 border border-slate-700">
                      <p className="text-xs text-gray-400 mb-1">رمز الوصول</p>
                      <div className="flex items-center justify-between">
                        <code className="text-lg font-mono text-primary">
                          {student.access_code}
                        </code>
                        <button
                          onClick={() => copyAccessCode(student.access_code)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {student.stories_read}
                        </p>
                        <p className="text-xs text-gray-400">قصة</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent-green">
                          {student.forms_submitted}
                        </p>
                        <p className="text-xs text-gray-400">نموذج</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/teacher/students/${student.id}`)}
                        size="sm"
                        variant="primary"
                        className="flex-1"
                      >
                        عرض
                      </Button>
                      <Button
                        onClick={() => deleteStudent(student.id)}
                        size="sm"
                        variant="danger"
                      >
                        🗑️
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Create Student Modal */}
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card>
                <h2 className="text-2xl font-bold text-white mb-4">إضافة طالب جديد</h2>
                
                <div className="mb-4">
                  <label className="block text-white font-bold mb-2">
                    اسم الطالب
                  </label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="مثال: محمد أحمد"
                    className="w-full px-4 py-3 text-lg border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary bg-slate-900 text-white"
                    disabled={isCreating}
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    سيتم إنشاء رمز وصول تلقائياً
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={createStudent}
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    isLoading={isCreating}
                    disabled={isCreating}
                  >
                    {isCreating ? 'جاري الإنشاء...' : 'إنشاء'}
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    variant="ghost"
                    size="lg"
                    disabled={isCreating}
                  >
                    إلغاء
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AnimatedBackground>
  )
}

