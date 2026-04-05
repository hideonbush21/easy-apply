import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-md font-medium',
  {
    variants: {
      variant: {
        default:  'bg-slate-100 text-slate-600',
        primary:  'bg-primary-50 text-primary-700',
        success:  'bg-success-50 text-success-700',
        warning:  'bg-warning-50 text-warning-700',
        danger:   'bg-danger-50 text-danger-700',
        info:     'bg-info-50 text-info-700',
        accent:   'bg-accent-50 text-accent-700',
        orange:   'bg-orange-50 text-orange-700',
        indigo:   'bg-indigo-50 text-indigo-700',
        amber:    'bg-amber-50 text-amber-700',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}
