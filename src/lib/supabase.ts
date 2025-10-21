import { createClient } from '@supabase/supabase-js'
import { useAppStore } from './store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper functions for common queries
export const authService = {
  async loginWithAccessCode(accessCode: string) {
    try {
      // Use the new authenticate_user function that sets session context
      const { data, error } = await supabase.rpc('authenticate_user', {
        access_code_param: accessCode
      })

      if (error) {
        console.error('RPC error:', error)
        throw error
      }
      
      if (!data) {
        throw new Error('Invalid access code')
      }

      return {
        user: data.user,
        type: data.type
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  async registerStudent(accessCode: string, name: string) {
    try {
      // First authenticate to set context
      const authResult = await this.loginWithAccessCode(accessCode)
      
      if (authResult.type !== 'student') {
        throw new Error('Access code is not for a student')
      }

      // Update student with name and mark as registered
      const { data, error } = await supabase
        .from('students')
        .update({
          name: name,
          is_registered: true
        })
        .eq('access_code', accessCode)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  },
}

export const storiesService = {
  async getStoriesByGrade(gradeLevel: number) {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('grade_level', gradeLevel)
      .order('difficulty', { ascending: true })

    if (error) throw error
    return data
  },

  async getStudentStories(studentAccessCode: string) {
    const { data, error } = await supabase.rpc('student_get_stories', {
      student_access_code: studentAccessCode
    })

    if (error) throw error
    return data
  },

  async getStudentSingleStory(studentAccessCode: string, storyId: string) {
    try {
      // First authenticate to ensure session context is set
      await authService.loginWithAccessCode(studentAccessCode)
      
      const { data, error } = await supabase.rpc('student_get_single_story', {
        student_access_code: studentAccessCode,
        story_uuid: storyId
      })

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Error in getStudentSingleStory:', error)
      throw error
    }
  },

  async getStudentStoryStatus(studentAccessCode: string) {
    try {
      // First authenticate to ensure session context is set
      await authService.loginWithAccessCode(studentAccessCode)
      
      const { data, error } = await supabase.rpc('student_get_story_status', {
        student_access_code: studentAccessCode
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error in getStudentStoryStatus:', error)
      throw error
    }
  },

  async getStoryProgress(studentId: string, storyId: string) {
    const { data, error } = await supabase
      .from('student_story_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('story_id', storyId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async updateStoryProgress(studentId: string, storyId: string, status: string) {
    const { data, error } = await supabase
      .from('student_story_progress')
      .upsert({
        student_id: studentId,
        story_id: storyId,
        status,
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error
    return data
  },
}

export const formsService = {
  async getFormByStory(storyId: string) {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('story_id', storyId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async getStudentFormTemplate(studentAccessCode: string, storyId: string) {
    const { data, error } = await supabase.rpc('student_get_form_template', {
      student_access_code: studentAccessCode,
      story_uuid: storyId
    })

    if (error) throw error
    return data?.[0] || null
  },

  async submitForm(studentAccessCode: string, storyId: string, formTemplateId: string, answers: Record<string, string>) {
    const { data, error } = await supabase.rpc('student_submit_form', {
      student_access_code: studentAccessCode,
      story_uuid: storyId,
      form_template_uuid: formTemplateId,
      form_responses: answers
    })

    if (error) throw error
    return data?.[0] || null
  },
}

export const gradingService = {
  async getTeacherSubmissions(teacherAccessCode: string) {
    const { data, error } = await supabase.rpc('teacher_get_submissions', {
      teacher_access_code: teacherAccessCode
    })

    if (error) throw error
    return data || []
  },

  async gradeSubmission(submissionId: string, grade: number, feedback: string) {
    console.log('Grading submission:', { submissionId, grade, feedback })
    
    // Use the new RPC function instead of direct table update
    const { data, error } = await supabase.rpc('teacher_grade_submission', {
      teacher_access_code: (await this.getCurrentTeacherAccessCode()),
      submission_uuid: submissionId,
      grade_value: grade,
      feedback_text: feedback
    })

    if (error) {
      console.error('Error grading submission:', error)
      throw error
    }
    
    console.log('Submission graded successfully:', data)
    return data?.[0] || null
  },

  async getCurrentTeacherAccessCode() {
    // Get the current teacher's access code from the store
    const { user } = useAppStore.getState()
    if (!user || !('access_code' in user)) {
      throw new Error('Teacher access code not available')
    }
    return (user as any).access_code as string
  },
}

export const leaderboardService = {
  async getLeaderboard(classroomId?: string) {
    console.log('Loading leaderboard data...')
    
    // Use the real-time leaderboard function instead of cache
    const { data, error } = await supabase.rpc('get_realtime_leaderboard')

    if (error) {
      console.error('Error loading leaderboard:', error)
      throw error
    }
    
    console.log('Leaderboard data loaded:', data?.length, 'students')
    
    // Filter by classroom if specified
    let filteredData = data || []
    if (classroomId) {
      // Note: We'd need to join with classrooms table to filter by classroom_id
      // For now, return all data
    }
    
    const processedData = filteredData.map((entry: any) => ({
      student_id: entry.student_id,
      name: entry.student_name,
      stories_read: entry.stories_read,
      forms_submitted: entry.forms_submitted,
      combined_score: entry.combined_score,
      rank: entry.rank,
      current_title: entry.current_title,
      grade: entry.grade,
      avg_grade: entry.avg_grade,
      graded_submissions: entry.graded_submissions
    }))
    
    console.log('Processed leaderboard data:', processedData.length, 'entries')
    return processedData
  },

  async refreshLeaderboardCache() {
    const { error } = await supabase.rpc('refresh_leaderboard_cache')
    if (error) throw error
  },
}

export const analyticsService = {
  async getTeacherAnalytics(teacherAccessCode: string) {
    const { data, error } = await supabase.rpc('get_teacher_analytics', {
      teacher_access_code: teacherAccessCode
    })

    if (error) throw error
    return data?.[0] || null
  },

  async getAdminAnalytics(adminAccessCode: string) {
    try {
      console.log('getAdminAnalytics called with:', adminAccessCode)
      console.log('Supabase client configured:', !!supabase)
      
      console.log('Calling admin_get_analytics RPC directly...')
      const { data, error } = await supabase.rpc('admin_get_analytics', {
        admin_access_code: adminAccessCode
      })

      console.log('RPC response:', { data, error })

      if (error) {
        console.error('RPC error:', error)
        throw error
      }
      
      console.log('Raw data from RPC:', data)
      console.log('First element:', data?.[0])
      
      // Handle different response formats
      let analyticsData = null
      
      if (Array.isArray(data) && data.length > 0) {
        // Check if it's in format: [{"admin_get_analytics": {...}}]
        if (data[0]?.admin_get_analytics) {
          analyticsData = data[0].admin_get_analytics
        } 
        // Check if it's in format: [{...}] (direct data)
        else if (data[0] && typeof data[0] === 'object') {
          analyticsData = data[0]
        }
      } else if (data && typeof data === 'object') {
        // Direct object response
        analyticsData = data
      }
      
      console.log('Extracted analytics data:', analyticsData)
      console.log('Returning data:', analyticsData)
      return analyticsData
    } catch (error) {
      console.error('Error in getAdminAnalytics:', error)
      throw error
    }
  },
}

export const adminService = {
  async ensureAdminContext() {
    // Check if we have a current user in the store
    const { user } = useAppStore.getState()
    if (!user) {
      throw new Error('No user logged in')
    }
    
    // Re-authenticate to ensure session context is set
    const accessCode = (user as any).access_code as string
    const authResult = await authService.loginWithAccessCode(accessCode)
    if (authResult.type !== 'admin') {
      throw new Error('User is not an admin')
    }
    
    return authResult.user
  },

  async createTeacher(teacherData: any) {
    const admin = await this.ensureAdminContext()
    
    // Generate unique email with timestamp and random string
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 6)
    const uniqueEmail = `teacher.grade${teacherData.assigned_grade}.${timestamp}${random}@library.edu`
    
    const { data, error } = await supabase.rpc('admin_create_teacher', {
      teacher_name: teacherData.name,
      teacher_email: teacherData.email || uniqueEmail,
      teacher_access_code: teacherData.access_code,
      teacher_grade: teacherData.assigned_grade,
      teacher_permission: teacherData.permission_level,
      admin_access_code: admin.access_code
    })

    if (error) throw error
    return data
  },

  async updateTeacher(teacherId: string, updates: any) {
    const admin = await this.ensureAdminContext()
    
    const { data, error } = await supabase.rpc('admin_update_teacher', {
      teacher_id: teacherId,
      updates: updates,
      admin_access_code: admin.access_code
    })

    if (error) throw error
    return data
  },

  async deleteTeacher(teacherId: string) {
    const admin = await this.ensureAdminContext()
    
    const { data, error } = await supabase.rpc('admin_delete_teacher', {
      teacher_id: teacherId,
      admin_access_code: admin.access_code
    })

    if (error) throw error
    return data
  }
}

export default supabase
