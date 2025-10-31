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

  async getTeacherStories(teacherAccessCode: string) {
    try {
      await authService.loginWithAccessCode(teacherAccessCode)
      
      const { data, error } = await supabase.rpc('teacher_get_stories', {
        teacher_access_code: teacherAccessCode
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error in getTeacherStories:', error)
      throw error
    }
  },

  async updateStory(teacherAccessCode: string, storyId: string, updates: any) {
    try {
      await authService.loginWithAccessCode(teacherAccessCode)
      
      const { data, error } = await supabase.rpc('teacher_update_story', {
        teacher_access_code: teacherAccessCode,
        story_uuid: storyId,
        title_arabic: updates.title_arabic,
        content_arabic: updates.content_arabic,
        difficulty: updates.difficulty
      })

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Error in updateStory:', error)
      throw error
    }
  },

  async deleteStory(teacherAccessCode: string, storyId: string) {
    try {
      await authService.loginWithAccessCode(teacherAccessCode)
      
      const { data, error } = await supabase.rpc('teacher_delete_story', {
        teacher_access_code: teacherAccessCode,
        story_uuid: storyId
      })

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Error in deleteStory:', error)
      throw error
    }
  },
}

export const storageService = {
  async uploadAudioRecording(audioBlob: Blob, studentAccessCode: string, storyId: string): Promise<string> {
    try {
      // Create a unique filename
      const timestamp = Date.now()
      const filename = `${studentAccessCode}_${storyId}_${timestamp}.webm`
      const filePath = `voice-recordings/${filename}`

      // Upload the blob to Supabase storage
      const { data, error } = await supabase.storage
        .from('student-recordings')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: true
        })

      if (error) {
        console.error('Error uploading audio:', error)
        throw error
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('student-recordings')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Failed to upload audio recording:', error)
      throw error
    }
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

  async submitForm(
    studentAccessCode: string, 
    storyId: string, 
    formTemplateId: string, 
    answers: Record<string, string>, 
    audioUrl?: string,
    autoGrade?: number,
    autoFeedback?: string
  ) {
    const submissionData: any = {
      student_access_code: studentAccessCode,
      story_uuid: storyId,
      form_template_uuid: formTemplateId,
      form_responses: answers
    }

    // Add optional parameters if provided
    if (audioUrl) {
      submissionData.audio_url = audioUrl
    }
    if (autoGrade !== undefined) {
      submissionData.auto_graded = autoGrade
    }
    if (autoFeedback) {
      submissionData.auto_feedback = autoFeedback
    }

    const { data, error } = await supabase.rpc('student_submit_form', submissionData)

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

  async gradeSubmission(submissionId: string, grade: number, feedback: string, voiceGrade?: number) {
    console.log('Grading submission:', { submissionId, grade, feedback, voiceGrade })
    
    // Use the new RPC function instead of direct table update
    const params: any = {
      teacher_access_code: (await this.getCurrentTeacherAccessCode()),
      submission_uuid: submissionId,
      grade_value: grade,
      feedback_text: feedback
    }
    
    if (voiceGrade !== undefined) {
      params.voice_grade_value = voiceGrade
    }
    
    const { data, error } = await supabase.rpc('teacher_grade_submission', params)

    if (error) {
      console.error('Error grading submission:', error)
      throw error
    }
    
    console.log('Submission graded successfully:', data)
    return data?.[0] || null
  },

  async getCurrentTeacherAccessCode() {
    // Get the current teacher or admin access code from the store
    const { user, userRole } = useAppStore.getState()
    if (!user || !('access_code' in user)) {
      throw new Error('User access code not available')
    }
    // Admins can also grade submissions
    if (userRole !== 'teacher' && userRole !== 'admin') {
      throw new Error('Only teachers and admins can grade submissions')
    }
    return (user as any).access_code as string
  },
}

export const studentSubmissionsService = {
  async getStudentSubmissions(studentAccessCode: string) {
    const { data, error } = await supabase.rpc('student_get_submissions', {
      student_access_code: studentAccessCode
    })

    if (error) {
      console.error('Error loading student submissions:', error)
      throw error
    }

    return data || []
  },
}

export const adminGradingService = {
  async getGradeSubmissions(gradeLevel: number) {
    console.log('Loading submissions for grade:', gradeLevel)
    
    // Use RPC function to bypass RLS policies
    const { data, error } = await supabase.rpc('admin_get_grade_submissions', {
      grade_num: gradeLevel
    })

    if (error) {
      console.error('Error loading grade submissions:', error)
      throw error
    }

    console.log('Loaded submissions for grade:', data?.length || 0)
    return data || []
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
      graded_submissions: entry.graded_submissions,
      total_score: entry.total_score
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
