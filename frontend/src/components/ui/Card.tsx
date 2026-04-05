import { cn } from './cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

function Card({ className, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-xl border border-slate-200',
        hover &&
          'transition-all duration-200 hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      style={{
        boxShadow: 'var(--shadow-card)',
        ...(hover ? {} : {}),
      }}
      onMouseEnter={
        hover
          ? e => {
              ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                'var(--shadow-hover)'
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? e => {
              ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                'var(--shadow-card)'
            }
          : undefined
      }
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 border-b border-slate-100', className)}
      {...props}
    />
  )
}

function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-5', className)} {...props} />
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl', className)}
      {...props}
    />
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export { Card }
