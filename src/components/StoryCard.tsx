import React from 'react'
import { motion } from 'framer-motion'
import Card from './Card'
import Button from './Button'
import { getDifficultyColor, getDifficultyArabic } from '@/lib/utils'
import { Story } from '@/types'

interface StoryCardProps {
  story: any // Updated to handle story with submission status
  onRead: () => void
  status?: 'not_started' | 'in_progress' | 'completed'
  isLocked?: boolean
  isNext?: boolean
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onRead,
  status = 'not_started',
  isLocked = false,
  isNext = false,
}) => {
  const diffColor = getDifficultyColor(story.story_difficulty || story.difficulty)
  const diffLabel = getDifficultyArabic(story.story_difficulty || story.difficulty)

  const getStatusIcon = () => {
    // Check submission status first
    if (story.submission_status === 'pending') {
      return '⏳' // Submitted, waiting for grading
    } else if (story.submission_status === 'graded') {
      return '✅' // Graded
    } else if (story.submission_status === 'reviewed') {
      return '📝' // Reviewed
    }
    
    // Fallback to original status logic
    switch (status) {
      case 'completed':
        return '✅'
      case 'in_progress':
        return '▶️'
      case 'not_started':
        return isLocked ? '🔒' : '📖'
      default:
        return '📖'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={isNext ? 'animate-pulse-glow' : ''}
    >
      <Card
        className={`overflow-hidden cursor-pointer ${
          isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-hover'
        }`}
        elevation="md"
      >
        <div className="text-center mb-4">
          <div className="text-6xl mb-3 inline-block">{getStatusIcon()}</div>
          {isNext && (
            <div className="inline-block bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
              اقرأ الآن
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 text-right">
          {story.story_title || story.title_arabic}
        </h3>

        <div className="flex justify-between items-center mb-4 text-sm">
          <div
            className="px-3 py-1 rounded-full text-white font-bold"
            style={{ backgroundColor: diffColor }}
          >
            {diffLabel}
          </div>
          <span className="text-gray-300">الصف {story.story_grade_level || story.grade_level}</span>
        </div>

        <div className="text-gray-300 text-sm mb-4 line-clamp-2 text-right">
          {(story.story_content || story.content_arabic || 'لا يوجد محتوى').substring(0, 80)}...
        </div>

        <Button
          onClick={onRead}
          disabled={isLocked || story.submission_status !== 'not_submitted'}
          size="md"
          className="w-full"
          variant={isNext ? 'secondary' : 'primary'}
        >
          {story.submission_status === 'pending' ? 'تم الإرسال ⏳' :
           story.submission_status === 'graded' ? 'تم التقييم ✅' :
           story.submission_status === 'reviewed' ? 'تم المراجعة 📝' :
           status === 'completed' ? 'اعد قراءة' : 'اقرأ القصة'}
        </Button>
      </Card>
    </motion.div>
  )
}

export default StoryCard
