'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface FloatingElement {
  id: number
  top: string
  left: string
  delay: number
  duration: number
  size: number
}

const generateElements = (count: number): FloatingElement[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 10,
    size: 20 + Math.random() * 40,
  }))
}

export const AnimatedBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false)
  const [elements] = React.useState(() => generateElements(15))

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-purple-900/20"></div>
        {children}
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Base gradient layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-purple-900/20 pointer-events-none" />

      {/* Animated grid background */}
      <svg
        className="fixed inset-0 w-full h-full opacity-5 pointer-events-none"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating stars and circles */}
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className="fixed rounded-full pointer-events-none"
          style={{
            top: element.top,
            left: element.left,
            width: element.size,
            height: element.size,
            background: `radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.4), rgba(99, 102, 241, 0.1))`,
            filter: 'blur(2px)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Floating clouds */}
      <motion.div
        className="fixed top-10 left-1/4 w-64 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: [0, 50, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="fixed bottom-20 right-1/4 w-80 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: [0, -50, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
      />

      <motion.div
        className="fixed top-1/3 right-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating books */}
      <motion.div
        className="fixed top-1/4 left-1/3 text-4xl pointer-events-none"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        📚
      </motion.div>

      <motion.div
        className="fixed bottom-1/3 right-1/3 text-4xl pointer-events-none"
        animate={{
          y: [0, 25, 0],
          rotate: [0, -8, 8, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      >
        ⭐
      </motion.div>

      <motion.div
        className="fixed top-1/2 right-1/4 text-4xl pointer-events-none"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      >
        ✨
      </motion.div>

      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-blue-500/10 to-transparent rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-t from-indigo-500/10 to-transparent rounded-full filter blur-3xl" />
      </div>

      {/* Content */}
      {children}
    </div>
  )
}

export default AnimatedBackground
