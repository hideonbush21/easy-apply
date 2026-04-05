import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn'
import { Spinner } from './Spinner'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'btn-gradient text-white shadow-lg shadow-violet-900/40 px-4 py-2 relative overflow-hidden',
        secondary:
          'btn-glass-outline',
        ghost:
          'text-slate-300 hover:bg-white/5 hover:text-white',
        danger:
          'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 hover:border-rose-400/40',
        accent:
          'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-900/40 hover:opacity-90',
      },
      size: {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-sm px-5 py-2.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
