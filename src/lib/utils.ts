import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const normalizeMimeType = (mimeType?: string): string => {
  if (!mimeType) return 'audio/webm'
  const base = mimeType.split(';')[0].trim().toLowerCase()
  if (base === 'audio/x-m4a') return 'audio/m4a'
  return base
}

export const getAudioExtensionFromMime = (mimeType?: string): string => {
  const normalized = normalizeMimeType(mimeType)
  switch (normalized) {
    case 'audio/m4a':
    case 'audio/mp4':
    case 'video/mp4':
      return 'mp4'
    case 'audio/mpeg':
      return 'mp3'
    case 'audio/aac':
      return 'aac'
    case 'audio/ogg':
    case 'audio/opus':
      return 'ogg'
    default:
      return 'webm'
  }
}

export const inferAudioMimeFromUrl = (url?: string): string => {
  if (!url) return 'audio/webm'
  const cleanUrl = url.split('?')[0]?.toLowerCase() || ''
  if (cleanUrl.endsWith('.mp3')) return 'audio/mpeg'
  if (cleanUrl.endsWith('.m4a') || cleanUrl.endsWith('.mp4')) return 'video/mp4'
  if (cleanUrl.endsWith('.aac')) return 'audio/aac'
  if (cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.opus')) return 'audio/ogg'
  return 'audio/webm'
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
