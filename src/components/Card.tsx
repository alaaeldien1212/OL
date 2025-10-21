import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  elevation?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, padding = 'md', elevation = 'md', ...props }, ref) => {
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
    }

    const elevationClasses = {
      none: '',
      sm: 'shadow-card',
      md: 'shadow-hover',
      lg: 'shadow-lg',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-slate-800 text-white rounded-xl transition-all duration-200 hover:shadow-hover border border-slate-700',
          paddingClasses[padding],
          elevationClasses[elevation],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
