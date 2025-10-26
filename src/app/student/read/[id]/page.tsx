'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { useAppStore } from '@/lib/store'
import { storiesService, storageService } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'

export default function StoryReader() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated } = useAppStore()
  const [isFullScreen, setIsFullScreen] = useState(true)
  const [readingTime, setReadingTime] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [story, setStory] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingDurationRef = useRef<NodeJS.Timeout | null>(null)

  const storyId = params.id as string

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    // Load story data
    const loadStory = async () => {
      try {
        setIsLoading(true)
        console.log('Loading story with ID:', storyId)
        
        const studentData = user as any
        const studentAccessCode = studentData.access_code
        
        console.log('Student access code:', studentAccessCode)
        
        const storyData = await storiesService.getStudentSingleStory(studentAccessCode, storyId)

        if (!storyData) {
          console.error('Story not found or not accessible')
          toast.error('القصة غير متاحة')
          router.push('/student')
          return
        }

        console.log('Loaded story:', storyData)
        console.log('Story title:', storyData.title_arabic)
        console.log('Story content:', storyData.content_arabic)
        console.log('Story content length:', storyData.content_arabic?.length)
        setStory(storyData)
      } catch (error) {
        console.error('Failed to load story:', error)
        toast.error('حدث خطأ في تحميل القصة')
        router.push('/student')
      } finally {
        setIsLoading(false)
      }
    }

    loadStory()

    // Track reading time
    const timer = setInterval(() => {
      setReadingTime((prev) => prev + 1)
    }, 1000)

    return () => {
      clearInterval(timer)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [isAuthenticated, router, storyId])

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingDurationRef.current) {
        clearInterval(recordingDurationRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // Start recording
  const startRecording = async () => {
    try {
      console.log('🔍 Starting recording...')
      console.log('User agent:', navigator.userAgent)
      console.log('Has getUserMedia:', !!navigator.mediaDevices?.getUserMedia)
      console.log('Has MediaRecorder:', typeof MediaRecorder !== 'undefined')

      // Check if MediaRecorder API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'متصفحك لا يدعم التسجيل الصوتي. استخدم Chrome أو Firefox'
        console.error('❌ getUserMedia not supported')
        toast.error(errorMsg)
        return
      }
      
      // Check if MediaRecorder exists
      if (typeof MediaRecorder === 'undefined') {
        const errorMsg = 'متصفحك لا يدعم MediaRecorder. استخدم Chrome أو Firefox'
        console.error('❌ MediaRecorder not supported')
        toast.error(errorMsg)
        return
      }

      console.log('✅ APIs supported, requesting permission...')

      // Request microphone permission - simplified for better mobile support
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true // Simplified to just request audio, let browser handle the rest
        })
        console.log('✅ Permission granted, stream obtained')
      } catch (permError: any) {
        console.error('❌ Permission error:', permError)
        throw permError
      }
      
      // Use MediaRecorder with basic configuration
      let mimeType = 'audio/webm' // Default
      
      // Try to find a supported MIME type - simpler approach
      try {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
          console.log('✅ Using audio/webm')
        } else {
          console.log('⚠️ audio/webm not supported')
        }
      } catch (e) {
        console.log('⚠️ Could not check MIME type support')
      }
      
      console.log('Creating MediaRecorder with mimeType:', mimeType)
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data)
          console.log('📦 Data chunk received:', event.data.size, 'bytes')
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped, creating blob from', chunks.length, 'chunks')
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        stream.getTracks().forEach(track => track.stop())
        console.log('✅ Recording saved successfully')
        toast.success('تم حفظ التسجيل! 🎉')
      }

      mediaRecorder.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event)
        toast.error('حدث خطأ أثناء التسجيل')
        setIsRecording(false)
        stream.getTracks().forEach(track => track.stop())
      }
      
      console.log('🎙️ Starting MediaRecorder...')
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
      
      // Start duration counter
      recordingDurationRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
      
      console.log('✅ Recording started successfully')
      toast.success('بدأ التسجيل 🎤')
    } catch (error: any) {
      console.error('❌ Error starting recording:', error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      
      // Detailed error messages for different failure scenarios
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('الرجاء السماح بالوصول للميكروفون. على الجوال: اضغط قفل في العنوان ← الموقع ← السماح', {
          duration: 6000
        })
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('لم يتم العثور على ميكروفون. تأكد من توصيل ميكروفون')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('الميكروفون مستخدم من قبل تطبيق آخر. أغلقه وحاول مرة أخرى')
      } else if (error.name === 'OverconstrainedError') {
        toast.error('إعدادات الميكروفون غير مدعومة')
      } else if (error.name === 'TypeError' && error.message?.includes('Failed to construct')) {
        toast.error('المتصفح لا يدعم التسجيل. جرب Chrome أو Firefox على HTTPS')
      } else {
        const errorMsg = error.message || error.name || 'خطأ غير معروف'
        console.error('Unexpected error:', error)
        toast.error(`فشل: ${errorMsg}`)
      }
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingDurationRef.current) {
        clearInterval(recordingDurationRef.current)
      }
      toast.success('تم إيقاف التسجيل')
    }
  }

  // Play audio
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
      toast.success('تشغيل التسجيل 🔊')
    }
  }

  // Stop audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  // Handle audio ended
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => setIsPlaying(false)
      audio.addEventListener('ended', handleEnded)
      return () => audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Delete recording
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
      setAudioBlob(null)
      setIsPlaying(false)
      toast.success('تم حذف التسجيل')
    }
  }

  const handleComplete = async () => {
    try {
      // Upload audio recording if it exists
      if (audioBlob) {
        toast.loading('جاري حفظ التسجيل الصوتي...', { id: 'uploading' })
        
        const studentData = user as any
        const studentAccessCode = studentData.access_code
        
        try {
          const audioUrl = await storageService.uploadAudioRecording(audioBlob, studentAccessCode, storyId)
          
          // Store the audio URL in localStorage with story ID as key
          const storageKey = `audio_recording_${storyId}`
          localStorage.setItem(storageKey, audioUrl)
          
          toast.success('تم حفظ التسجيل الصوتي بنجاح! 🎉', { id: 'uploading' })
        } catch (error) {
          console.error('Error uploading audio:', error)
          toast.error('فشل تحميل التسجيل الصوتي، سيتم المتابعة بدون تسجيل', { id: 'uploading' })
        }
      } else {
        toast.success('تم إكمال قراءة القصة! 🎉')
      }
      
      setTimeout(() => {
        router.push(`/student/submit/${storyId}`)
      }, 1500)
    } catch (error) {
      console.error('Error completing story:', error)
      toast.error('حدث خطأ في إكمال القصة')
      router.push(`/student/submit/${storyId}`)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="w-full h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">📚</div>
            <p className="text-2xl font-bold text-white">جاري تحميل القصة...</p>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  if (!story) {
    return (
      <AnimatedBackground>
        <div className="w-full h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-2xl font-bold text-white">لم يتم العثور على القصة</p>
            <Button onClick={() => router.push('/student')} className="mt-4">
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <>
      <Toaster position="top-center" />

      {isFullScreen ? (
        // Full Screen Reading Mode
        <motion.div
          className="fixed inset-0 bg-gradient-to-br from-cloud via-white to-blue-50 z-50"
          onClick={() => setShowControls(!showControls)}
          onMouseMove={() => setShowControls(true)}
        >
          {/* Story Content */}
          <div className="w-full h-full flex flex-col items-center justify-start overflow-auto p-4 md:p-12 pt-20 pb-32 md:pt-12 md:pb-40">
            <div className="max-w-4xl w-full mt-8 md:mt-0">
              {/* Story Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-arabic">
                  {story.title_arabic}
                </h1>
                <p className="text-gray-200 text-lg mb-4">قصة جميلة ومفيدة</p>
                <div className="flex justify-center gap-4">
                  <span className={`px-4 py-2 text-white rounded-full font-bold ${
                    story.difficulty === 'easy' ? 'bg-accent-green' :
                    story.difficulty === 'medium' ? 'bg-secondary' : 'bg-accent-red'
                  }`}>
                    {story.difficulty === 'easy' ? 'سهل' : 
                     story.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                  </span>
                  <span className="px-4 py-2 bg-primary text-white rounded-full font-bold">
                    الصف {story.grade_level}
                  </span>
                </div>
              </motion.div>

              {/* Story Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-right leading-relaxed text-gray-800 mb-8 bg-white/90 backdrop-blur-sm p-4 md:p-8 rounded-xl shadow-lg border border-gray-200 overflow-x-hidden overflow-y-visible"
              >
                <div className="whitespace-pre-wrap font-arabic break-words" style={{ lineHeight: '2' }}>
                  {story.content_arabic}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Hidden Audio Player */}
          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} />
          )}

          {/* Top Controls */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/20 to-transparent flex justify-between items-center pointer-events-none"
          >
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="md"
              className="text-white pointer-events-auto hover:bg-white/20"
            >
              العودة
            </Button>
            <span className="text-white font-bold text-lg">
              ⏱️ {formatTime(readingTime)}
            </span>
          </motion.div>

          {/* Bottom Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/30 to-transparent flex flex-col items-center gap-4 pointer-events-none"
          >
            {/* Recording Controls */}
            <div className="flex gap-3 pointer-events-auto items-center">
              {isRecording && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-bold">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>{formatTime(recordingDuration)}</span>
                </div>
              )}
              {!audioUrl ? (
                <>
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      variant="secondary"
                      size="md"
                      className="bg-white/20 hover:bg-white/30"
                    >
                      <span className="mr-2">🎤</span>بدء التسجيل
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      variant="danger"
                      size="lg"
                      className="shadow-lg"
                    >
                      <span className="mr-2">⏹️</span>إيقاف التسجيل
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={isPlaying ? stopAudio : playAudio}
                    variant={isPlaying ? "secondary" : "primary"}
                    size="md"
                  >
                    {isPlaying ? (
                      <>
                        <span className="mr-2">⏸️</span>إيقاف
                      </>
                    ) : (
                      <>
                        <span className="mr-2">▶️</span>تشغيل
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={deleteRecording}
                    variant="ghost"
                    size="md"
                    className="bg-white/20 hover:bg-white/30"
                  >
                    <span className="mr-2">🗑️</span>حذف
                  </Button>
                </>
              )}
            </div>

            {/* Main Controls */}
            <div className="flex gap-4 pointer-events-auto">
              {!isRecording && (
                <Button
                  onClick={() => setIsFullScreen(false)}
                  variant="secondary"
                  size="lg"
                >
                  الخروج من ملء الشاشة
                </Button>
              )}
              <Button
                onClick={handleComplete}
                variant="primary"
                size="lg"
                className="shadow-lg"
              >
                انتهيت من القراءة ✓
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        // Normal Reading Mode
        <AnimatedBackground>
          <div className="w-full min-h-screen p-4 md:p-6" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-xl md:text-4xl font-bold text-white">
                  {story.title_arabic} 📖
                </h1>
                <Button
                  onClick={() => router.back()}
                  variant="ghost"
                  size="sm"
                  className="w-full md:w-auto"
                >
                  العودة
                </Button>
              </div>

              {/* Info */}
              <Card className="mb-6" elevation="sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="text-gray-200 text-sm">وقت القراءة</p>
                    <p className="text-xl md:text-2xl font-bold text-primary">{formatTime(readingTime)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-block px-3 py-1 md:px-4 md:py-2 text-white text-sm rounded-full font-bold ${
                      story.difficulty === 'easy' ? 'bg-accent-green' :
                      story.difficulty === 'medium' ? 'bg-secondary' : 'bg-accent-red'
                    }`}>
                      {story.difficulty === 'easy' ? 'سهل' : 
                       story.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                    </span>
                    <span className="inline-block px-3 py-1 md:px-4 md:py-2 bg-primary text-white text-sm rounded-full font-bold">
                      الصف {story.grade_level}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Story */}
              <Card elevation="md" padding="lg" className="mb-8 overflow-hidden">
                <div className="text-base md:text-xl text-right leading-relaxed space-y-4 font-arabic" style={{ lineHeight: '2.2' }}>
                  <div className="whitespace-pre-wrap bg-gray-50 p-3 md:p-6 rounded-lg border-r-4 border-primary break-words">
                    {story.content_arabic}
                  </div>
                </div>
              </Card>

              {/* Progress Bar */}
              <Card elevation="sm" padding="lg" className="mb-6">
                <div className="mb-3">
                  <p className="text-gray-200 mb-2">تقدم القراءة</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-200">٣ من ٤ فقرات</p>
              </Card>

              {/* Voice Recording Card */}
              <Card elevation="md" padding="lg" className="mb-6">
                <div className="mb-4">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">🎤 تسجيل القراءة</h3>
                  <p className="text-gray-200 text-xs md:text-sm">سجل نفسك وأنت تقرأ، ثم استمع إلى تسجيلك</p>
                </div>

                {/* Recording Status */}
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-4 bg-red-50 rounded-lg border-2 border-red-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-700 font-bold">جاري التسجيل...</span>
                      </div>
                      <span className="text-red-700 font-bold">{formatTime(recordingDuration)}</span>
                    </div>
                  </motion.div>
                )}

                {/* Controls */}
                <div className="flex gap-2 md:gap-3 flex-wrap">
                  {!audioUrl ? (
                    <>
                      {!isRecording ? (
                        <Button
                          onClick={startRecording}
                          variant="primary"
                          size="md"
                          className="flex-1 min-w-[120px] text-sm md:text-base"
                        >
                          <span className="mr-2">🎤</span>بدء التسجيل
                        </Button>
                      ) : (
                        <Button
                          onClick={stopRecording}
                          variant="danger"
                          size="md"
                          className="flex-1 min-w-[120px] text-sm md:text-base"
                        >
                          <span className="mr-2">⏹️</span>إيقاف
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={isPlaying ? stopAudio : playAudio}
                        variant={isPlaying ? "secondary" : "primary"}
                        size="md"
                        className="flex-1 min-w-[120px] text-sm md:text-base"
                      >
                        {isPlaying ? (
                          <>
                            <span className="mr-2">⏸️</span>إيقاف
                          </>
                        ) : (
                          <>
                            <span className="mr-2">▶️</span>تشغيل
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={deleteRecording}
                        variant="ghost"
                        size="md"
                        className="border-2 border-gray-300 text-sm md:text-base"
                      >
                        <span className="mr-2">🗑️</span>حذف
                      </Button>
                    </>
                  )}
                </div>

                {/* Hidden Audio Player */}
                {audioUrl && (
                  <audio ref={audioRef} src={audioUrl} />
                )}
              </Card>

              {/* Actions */}
              <div className="flex gap-2 md:gap-4">
                <Button
                  onClick={() => setIsFullScreen(true)}
                  variant="secondary"
                  size="md"
                  className="flex-1 text-sm md:text-base"
                >
                  ملء الشاشة
                </Button>
                <Button
                  onClick={handleComplete}
                  variant="primary"
                  size="md"
                  className="flex-1 text-sm md:text-base"
                >
                  انتهيت من القراءة ✓
                </Button>
              </div>
            </motion.div>
          </div>
        </AnimatedBackground>
      )}
    </>
  )
}
