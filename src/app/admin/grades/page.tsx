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
  X,
  Award,
  FileText
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

interface Classroom {
  id: string
  name: string
  grade: number
  is_active: boolean
  created_at: string
}

interface Submission {
  id: string
  student_name: string
  student_access_code: string
  story_title: string
  form_title: string
  grade?: number
  voice_grade?: number
  submitted_at: string
  feedback?: string
}

export default function GradeManagement() {
  const router = useRouter()
  const { user, userRole } = useAppStore()
  const [grades, setGrades] = useState<Grade[]>([])
  const [gradeStats, setGradeStats] = useState<GradeStats[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [newGrade, setNewGrade] = useState({
    name: ''
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
      
      // Load classrooms using RPC function
      const { data: classroomsData, error: classroomsError } = await supabase.rpc('admin_get_classrooms')
      
      console.log('Classrooms loaded:', classroomsData)
      console.log('Classrooms error:', classroomsError)
      
      if (!classroomsError && classroomsData) {
        setClassrooms(classroomsData)
      }
      
      // Load grades from database
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .order('id')

      console.log('Grades loaded from DB:', gradesData)

      if (!gradesError && gradesData) {
        setGrades(gradesData)
      } else {
        console.error('Error loading grades:', gradesError)
      }
      
      // Create stats from classrooms data and fetch real counts
      const statsPromises = (gradesData || []).map(async (grade) => {
        const existingClassrooms = classroomsData?.filter((c: any) => c.grade === grade.id) || []
        const classroomIds = existingClassrooms.map((c: any) => c.id)
        
        // Get student count for this grade (from classrooms in this grade)
        let studentCount = 0
        if (classroomIds.length > 0) {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .in('classroom_id', classroomIds)
            .eq('is_registered', true)
          studentCount = count || 0
        }
        
        // Get teacher count for this grade from teachers table
        const { count: teacherCountResult } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_grade', grade.id)
          .eq('is_active', true)
        
        const teacherCount = teacherCountResult || 0
        
        // Get story count for this grade
        const { count: storyCount } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('grade_level', grade.id)
        
        return {
          grade: grade.id,
          teachers_count: teacherCount,
          students_count: studentCount,
          stories_count: storyCount || 0
        }
      })
      
      const stats = await Promise.all(statsPromises)
      setGradeStats(stats)

      // Load all submissions with grades
      const { data: subsData, error: subsError } = await supabase
        .from('student_submissions')
        .select(`
          id,
          grade,
          voice_grade,
          submitted_at,
          feedback_arabic,
          students!inner(name, access_code),
          form_templates!inner(title_arabic, story_id)
        `)
        .order('submitted_at', { ascending: false })

      if (subsError) {
        console.error('Error loading submissions:', subsError)
        setSubmissions([])
      } else {
        // Get story titles separately
        const submissionPromises = (subsData || []).map(async (sub: any) => {
          let storyTitle = 'Unknown'
          
          if (sub.form_templates?.story_id) {
            const { data: storyData } = await supabase
              .from('stories')
              .select('title_arabic')
              .eq('id', sub.form_templates.story_id)
              .single()
            
            if (storyData) {
              storyTitle = storyData.title_arabic
            }
          }

          return {
            id: sub.id,
            student_name: sub.students?.name || 'Unknown',
            student_access_code: sub.students?.access_code || 'Unknown',
            story_title: storyTitle,
            form_title: sub.form_templates?.title_arabic || 'Unknown',
            grade: sub.grade,
            voice_grade: sub.voice_grade,
            submitted_at: sub.submitted_at,
            feedback: sub.feedback_arabic
          }
        })

        const formattedSubmissions = await Promise.all(submissionPromises)
        setSubmissions(formattedSubmissions)
      }
    } catch (error) {
      console.error('Error loading grades:', error)
      toast.error('فشل تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const updateGradeName = async (gradeId: number, newName: string) => {
    if (!newName.trim()) {
      toast.error('الرجاء إدخال اسم')
      return
    }

    try {
      const { error } = await supabase
        .from('grades')
        .update({ 
          name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', gradeId)

      if (error) throw error

      toast.success('تم تحديث اسم الصف بنجاح! 🎉')
      setEditingGrade(null)
      loadGrades()
    } catch (error: any) {
      console.error('Error updating grade:', error)
      toast.error('فشل تحديث اسم الصف')
    }
  }

  const deleteGrade = async (gradeId: number, gradeName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الصف "${gradeName}"؟\nسيتم حذف جميع البيانات المرتبطة بهذا الصف.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId)

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
        .from('grades')
        .update({ 
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', gradeId)

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
            onClick={() => router.push('/admin')}
            variant="ghost"
            size="md"
          >
            العودة للرئيسية
          </Button>
        </div>

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
                  <Card className="p-4 md:p-6 hover:shadow-hover transition-all duration-200">
                    <div className="flex justify-between items-start mb-4" onClick={() => editingGrade?.id !== grade.id && router.push(`/admin/grades/${grade.id}`)}>
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
                        {editingGrade?.id === grade.id ? (
                          <input
                            type="text"
                            defaultValue={grade.name}
                            onBlur={(e) => {
                              if (e.target.value !== grade.name) {
                                updateGradeName(grade.id, e.target.value)
                              } else {
                                setEditingGrade(null)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingGrade(null)
                              } else if (e.key === 'Enter') {
                                const newName = e.currentTarget.value
                                if (newName !== grade.name) {
                                  updateGradeName(grade.id, newName)
                                } else {
                                  setEditingGrade(null)
                                }
                              }
                            }}
                            autoFocus
                            className="bg-slate-700 text-white font-bold px-2 py-1 rounded border-2 border-primary focus:outline-none text-sm md:text-base min-w-0 flex-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base md:text-xl font-bold text-white truncate">{grade.name}</h3>
                            <p className="text-gray-300 text-xs md:text-sm truncate">{grade.description}</p>
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs md:text-sm font-bold flex-shrink-0 ${
                        grade.is_active
                          ? 'bg-accent-green text-white'
                          : 'bg-accent-red text-white'
                      }`}>
                        {grade.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                      {editingGrade?.id === grade.id ? (
                        <>
                          <Button
                            onClick={() => setEditingGrade(null)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 md:flex-none"
                            icon={<X className="w-3 h-3 md:w-4 md:h-4" />}
                          >
                            إلغاء
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => setEditingGrade(grade)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 md:flex-none"
                            icon={<Edit className="w-3 h-3 md:w-4 md:h-4" />}
                          >
                            <span className="hidden md:inline">تعديل الاسم</span>
                            <span className="md:hidden">تعديل</span>
                          </Button>
                          <Button
                            onClick={() => deleteGrade(grade.id, grade.name)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 md:flex-none"
                            icon={<Trash2 className="w-3 h-3 md:w-4 md:h-4" />}
                          >
                            حذف
                          </Button>
                          <Button
                            onClick={() => toggleGradeStatus(grade.id, grade.is_active)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 md:flex-none"
                          >
                            <span className="hidden md:inline">{grade.is_active ? 'إلغاء التفعيل' : 'تفعيل'}</span>
                            <span className="md:hidden">{grade.is_active ? 'إلغاء' : 'تفعيل'}</span>
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                      <div className="text-center">
                        <Users className="w-5 h-5 md:w-6 md:h-6 text-secondary mx-auto mb-1 md:mb-2" />
                        <div className="text-base md:text-lg font-bold text-white">{stats?.teachers_count || 0}</div>
                        <div className="text-xs text-gray-400">معلم</div>
                      </div>
                      <div className="text-center">
                        <Users className="w-5 h-5 md:w-6 md:h-6 text-accent-green mx-auto mb-1 md:mb-2" />
                        <div className="text-base md:text-lg font-bold text-white">{stats?.students_count || 0}</div>
                        <div className="text-xs text-gray-400">طالب</div>
                      </div>
                      <div className="text-center">
                        <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-accent-red mx-auto mb-1 md:mb-2" />
                        <div className="text-base md:text-lg font-bold text-white">{stats?.stories_count || 0}</div>
                        <div className="text-xs text-gray-400">قصة</div>
                      </div>
                    </div>

                    {/* View Info */}
                    <div className="pt-4 border-t border-slate-700">
                      <Button
                        onClick={() => router.push(`/admin/grades/${grade.id}`)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        عرض التفاصيل
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

        {/* Registered Classes Section */}
        {classrooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <Card className="p-4 md:p-8">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-xl md:text-3xl font-bold text-white">جميع الصفوف المسجلة</h2>
                  <p className="text-gray-300 text-sm md:text-base">عرض جميع الصفوف الدراسية المسجلة في النظام</p>
                </div>
              </div>

              {/* Classrooms Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-700">
                      <th className="text-right py-3 px-2 md:py-4 md:px-4 text-xs md:text-sm font-bold text-gray-300">الصف</th>
                      <th className="text-right py-3 px-2 md:py-4 md:px-4 text-xs md:text-sm font-bold text-gray-300 hidden md:table-cell">الاسم</th>
                      <th className="text-right py-3 px-2 md:py-4 md:px-4 text-xs md:text-sm font-bold text-gray-300 hidden lg:table-cell">الوصف</th>
                      <th className="text-right py-3 px-2 md:py-4 md:px-4 text-xs md:text-sm font-bold text-gray-300">الحالة</th>
                      <th className="text-right py-3 px-2 md:py-4 md:px-4 text-xs md:text-sm font-bold text-gray-300 hidden md:table-cell">تاريخ الإنشاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classrooms.map((classroom, index) => (
                      <motion.tr
                        key={classroom.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-2 md:py-4 md:px-4 font-bold text-white text-xs md:text-sm">
                          الصف {classroom.grade}
                        </td>
                        <td className="py-3 px-2 md:py-4 md:px-4 text-gray-300 hidden md:table-cell text-xs md:text-sm">{classroom.name}</td>
                        <td className="py-3 px-2 md:py-4 md:px-4 text-gray-300 hidden lg:table-cell text-xs md:text-sm">-</td>
                        <td className="py-3 px-2 md:py-4 md:px-4">
                          <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold ${
                            classroom.is_active
                              ? 'bg-accent-green text-white'
                              : 'bg-accent-red text-white'
                          }`}>
                            {classroom.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="py-3 px-2 md:py-4 md:px-4 text-gray-400 text-xs md:text-sm hidden md:table-cell">
                          {new Date(classroom.created_at).toLocaleDateString('ar-SA')}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Submissions Section */}
        {submissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-3xl font-bold text-white">جميع التقييمات المسجلة</h2>
                  <p className="text-gray-300">عرض جميع إجابات الطلاب وتقييماتهم</p>
                </div>
              </div>

              {/* Submissions Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-700">
                      <th className="text-right py-4 px-4 text-sm font-bold text-gray-300">الطالب</th>
                      <th className="text-right py-4 px-4 text-sm font-bold text-gray-300">القصة</th>
                      <th className="text-right py-4 px-4 text-sm font-bold text-gray-300">النموذج</th>
                      <th className="text-right py-4 px-4 text-sm font-bold text-gray-300">تقييم النموذج</th>
                      <th className="text-right py-4 px-4 text-sm font-bold text-gray-300">تقييم الصوت</th>
                      <th className="text-right py-4 px-4 text-sm font-bold text-gray-300">المعدل النهائي</th>
                      <th className="text-right py-4 px-4 text-sm font-bold text-gray-300">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission, index) => {
                      const finalGrade = submission.grade !== null && submission.grade !== undefined && 
                                         submission.voice_grade !== null && submission.voice_grade !== undefined
                                         ? Math.round((submission.grade + submission.voice_grade) / 2)
                                         : submission.grade ?? submission.voice_grade ?? null

                      return (
                        <motion.tr
                          key={submission.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="font-bold text-white">{submission.student_name}</div>
                            <div className="text-xs text-gray-400">{submission.student_access_code}</div>
                          </td>
                          <td className="py-4 px-4 text-gray-300">{submission.story_title}</td>
                          <td className="py-4 px-4 text-gray-300">{submission.form_title}</td>
                          <td className="py-4 px-4">
                            {submission.grade !== null && submission.grade !== undefined ? (
                              <span className="text-blue-400 font-bold">{submission.grade}/100</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {submission.voice_grade !== null && submission.voice_grade !== undefined ? (
                              <span className="text-purple-400 font-bold">{submission.voice_grade}/100</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {finalGrade !== null ? (
                              <span className={`font-bold ${
                                finalGrade >= 90 ? 'text-green-400' :
                                finalGrade >= 70 ? 'text-blue-400' :
                                finalGrade >= 50 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {finalGrade}/100
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-400 text-sm">
                            {new Date(submission.submitted_at).toLocaleDateString('ar-SA')}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
