import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  to?: string
  icon?: ReactNode
  fullWidth?: boolean
}

const baseStyle = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

export function PrimaryButton({ to, icon, fullWidth, className, children, ...props }: ButtonProps) {
  const classes = cn(baseStyle, 'bg-ez-primary text-white shadow-button hover:bg-ez-primary-dark', fullWidth && 'w-full', className)

  if (to) {
    return <Link to={to} className={classes}>{children}{icon}</Link>
  }

  return <button className={classes} {...props}>{children}{icon}</button>
}

export function SecondaryButton({ to, icon, fullWidth, className, children, ...props }: ButtonProps) {
  const classes = cn(baseStyle, 'border border-ez-border bg-white text-ez-text hover:bg-ez-primary-soft', fullWidth && 'w-full', className)

  if (to) {
    return <Link to={to} className={classes}>{children}{icon}</Link>
  }

  return <button className={classes} {...props}>{children}{icon}</button>
}
