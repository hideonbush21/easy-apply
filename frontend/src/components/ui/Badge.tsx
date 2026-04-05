import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium',
  {
    variants: {
      variant: {
        default:  'bg-white/10 text-slate-300 border border-white/10',
        primary:  'bg-violet-500/15 text-violet-300 border border-violet-500/25',
        success:  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
        warning:  'bg-amber-500/15 text-amber-300 border border-amber-500/25',
        danger:   'bg-rose-500/15 text-rose-300 border border-rose-500/25',
        info:     'bg-sky-500/15 text-sky-300 border border-sky-500/25',
        accent:   'bg-sky-500/15 text-sky-300 border border-sky-500/25',
        orange:   'bg-orange-500/15 text-orange-300 border border-orange-500/25',
        indigo:   'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25',
        amber:    'bg-amber-500/15 text-amber-300 border border-amber-500/25',
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
