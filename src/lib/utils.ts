import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return '#4CD17E' // Green
    case 'medium':
      return '#FFD44D' // Yellow
    case 'hard':
      return '#FF6F6F' // Red
    default:
      return '#48B8FF' // Blue
  }
}

export const getDifficultyArabic = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'سهل'
    case 'medium':
      return 'متوسط'
    case 'hard':
      return 'صعب'
    default:
      return ''
  }
}

export const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ar-SA')
}
