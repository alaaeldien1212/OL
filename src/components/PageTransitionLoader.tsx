'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

let setGlobalLoading: ((loading: boolean) => void) | null = null

export function showPageLoader() {
  if (setGlobalLoading) {
    setGlobalLoading(true)
  }
}

export function hidePageLoader() {
  if (setGlobalLoading) {
    setGlobalLoading(false)
  }
}

export default function PageTransitionLoader() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  useEffect(() => {
    setGlobalLoading = setIsLoading
    return () => {
      setGlobalLoading = null
    }
  }, [])

  // Track pathname changes - this is the accurate way
  useEffect(() => {
    if (pathname !== prevPathname) {
      // Path changed, so loading is complete
      setIsLoading(false)
      setPrevPathname(pathname)
    }
  }, [pathname, prevPathname])

  // Safety timeout - only if something goes wrong
  useEffect(() => {
    if (isLoading) {
      const safetyTimer = setTimeout(() => {
        setIsLoading(false)
      }, 3000) // Safety net after 3 seconds
      return () => clearTimeout(safetyTimer)
    }
  }, [isLoading])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-sm"
        >
          {/* Animated background effects matching home page */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/15 pointer-events-none" />
          
          {/* Floating blur effects */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-48 h-48 md:w-64 md:h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
            animate={{
              x: [0, 30, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-56 h-56 md:w-80 md:h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
            animate={{
              x: [0, -30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />

          <div className="relative text-center px-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center gap-4 md:gap-6"
            >
              {/* Logo */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="relative"
              >
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80">
                  <img 
                    src="/logow.png" 
                    alt="البيان" 
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                  {/* Glow effect */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0, 0.3]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-2xl"
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="space-y-1 md:space-y-2"
              >
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  البيان
                </h1>
                <p className="text-gray-300 text-xs md:text-sm lg:text-base">
                  منصة تعليمية تفاعلية
                </p>
              </motion.div>

              {/* Loading Spinner */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-blue-400 animate-spin" />
                <span className="text-gray-400 text-xs md:text-sm">جاري التحميل...</span>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Progress bar at top */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="absolute top-0 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 origin-left shadow-lg shadow-blue-500/50"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

