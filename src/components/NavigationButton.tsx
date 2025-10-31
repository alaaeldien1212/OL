'use client'

import { useRouter } from 'next/navigation'
import Button from './Button'
import { showPageLoader } from './PageTransitionLoader'
import { ReactNode } from 'react'

interface NavigationButtonProps {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  className?: string
  onClick?: () => void
}

export default function NavigationButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  onClick,
}: NavigationButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    showPageLoader()
    setTimeout(() => {
      router.push(href)
    }, 100)
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      icon={icon}
      className={className}
    >
      {children}
    </Button>
  )
}

