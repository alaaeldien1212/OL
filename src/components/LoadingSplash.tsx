'use client'

import { motion } from 'framer-motion'
import { BookOpen, Loader2 } from 'lucide-react'

export default function LoadingSplash() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Logo/Icon */}
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.5
            }}
            className="relative"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary via-secondary to-purple-600 flex items-center justify-center shadow-2xl">
              <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div>
            <motion.div
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary"
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              📚 البيان
            </h1>
            <p className="text-gray-300 text-sm md:text-base">
              منصة تعليمية تفاعلية
            </p>
          </motion.div>

          {/* Loading Spinner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-gray-400 text-sm">جاري التحميل...</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

