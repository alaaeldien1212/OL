import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-secondary focus:ring-offset-2 active:scale-95',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-blue-600 active:bg-blue-700',
        secondary: 'bg-secondary text-ink hover:bg-yellow-500 active:bg-yellow-600',
        success: 'bg-accent-green text-white hover:bg-green-600 active:bg-green-700',
        danger: 'bg-accent-red text-white hover:bg-red-600 active:bg-red-700',
        outline: 'border-2 border-primary text-white hover:bg-blue-600/20 active:bg-blue-600/30',
        ghost: 'text-white hover:bg-gray-800 active:bg-gray-700',
      },
      size: {
        xs: 'px-3 py-1 text-xs',
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base min-h-[44px]',
        lg: 'px-8 py-4 text-lg min-h-[54px]',
        xl: 'px-10 py-5 text-xl min-h-[64px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, icon, children, disabled, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      ref={ref}
      {...props}
    >
      {isLoading && (
        <svg
          className="h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !isLoading && icon}
      {children}
    </button>
  )
)

Button.displayName = 'Button'

export default Button
