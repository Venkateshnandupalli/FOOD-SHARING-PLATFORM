import React from 'react'
import { cn } from '@/lib/utils'

// ─── Button ───────────────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: `
    bg-[hsl(142,71%,28%)] text-white 
    hover:bg-[hsl(142,71%,22%)] 
    focus-visible:ring-[hsl(142,71%,28%)]
    shadow-[0_4px_14px_hsla(142,71%,28%,0.35)]
    hover:shadow-[0_6px_20px_hsla(142,71%,28%,0.45)]
  `,
  secondary: `
    bg-[hsl(25,95%,53%)] text-white 
    hover:bg-[hsl(25,90%,44%)]
    focus-visible:ring-[hsl(25,95%,53%)]
    shadow-[0_4px_14px_hsla(25,95%,53%,0.35)]
    hover:shadow-[0_6px_20px_hsla(25,95%,53%,0.45)]
  `,
  outline: `
    bg-transparent border-2 border-[hsl(142,71%,28%)] text-[hsl(142,71%,28%)]
    hover:bg-[hsl(142,50%,95%)]
    focus-visible:ring-[hsl(142,71%,28%)]
  `,
  ghost: `
    bg-transparent text-[hsl(220,15%,35%)]
    hover:bg-[hsl(220,13%,94%)]
    focus-visible:ring-[hsl(220,13%,70%)]
  `,
  danger: `
    bg-[hsl(0,75%,50%)] text-white
    hover:bg-[hsl(0,75%,42%)]
    focus-visible:ring-[hsl(0,75%,50%)]
    shadow-[0_4px_14px_hsla(0,75%,50%,0.30)]
  `,
  success: `
    bg-[hsl(142,70%,35%)] text-white
    hover:bg-[hsl(142,70%,28%)]
    focus-visible:ring-[hsl(142,70%,35%)]
  `,
}

const buttonSizes: Record<ButtonSize, string> = {
  sm:  'h-8 px-3 text-xs',
  md:  'h-10 px-5 text-sm',
  lg:  'h-12 px-7 text-base',
  xl:  'h-14 px-9 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" color="current" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ hover, glass, padding = 'md', className, children, ...props }: CardProps) {
  const padMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }
  return (
    <div
      className={cn(
        'rounded-[16px] border border-[hsl(220,13%,90%)]',
        glass
          ? 'bg-white/70 backdrop-blur-xl border-white/50'
          : 'bg-white',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
        hover && 'transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)]',
        padMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-[hsl(220,13%,92%)] text-[hsl(220,15%,35%)]',
  success: 'bg-[hsl(142,60%,90%)] text-[hsl(142,70%,25%)]',
  warning: 'bg-[hsl(38,90%,88%)]  text-[hsl(38,80%,28%)]',
  danger:  'bg-[hsl(0,70%,92%)]   text-[hsl(0,65%,35%)]',
  info:    'bg-[hsl(210,80%,92%)] text-[hsl(210,80%,30%)]',
  purple:  'bg-[hsl(270,70%,92%)] text-[hsl(270,60%,35%)]',
}

export function Badge({ variant = 'default', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[hsl(220,15%,20%)]">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[hsl(220,10%,52%)] flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 px-4 rounded-[10px] border bg-white text-[hsl(220,15%,15%)] text-sm',
              'border-[hsl(220,13%,88%)] placeholder:text-[hsl(220,10%,65%)]',
              'transition-all duration-150',
              'focus:outline-none focus:border-[hsl(142,71%,28%)] focus:ring-2 focus:ring-[hsla(142,71%,28%,0.15)]',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[hsl(220,10%,52%)] flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[hsl(220,10%,52%)]">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-[hsl(220,15%,20%)]">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-3 rounded-[10px] border bg-white text-[hsl(220,15%,15%)] text-sm resize-y min-h-[100px]',
          'border-[hsl(220,13%,88%)] placeholder:text-[hsl(220,10%,65%)]',
          'transition-all duration-150',
          'focus:outline-none focus:border-[hsl(142,71%,28%)] focus:ring-2 focus:ring-[hsla(142,71%,28%,0.15)]',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-[hsl(220,15%,20%)]">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full h-11 px-4 rounded-[10px] border bg-white text-[hsl(220,15%,15%)] text-sm appearance-none cursor-pointer',
          'border-[hsl(220,13%,88%)]',
          'transition-all duration-150',
          'focus:outline-none focus:border-[hsl(142,71%,28%)] focus:ring-2 focus:ring-[hsla(142,71%,28%,0.15)]',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

// ─── Spinner ──────────────────────────────────────────────────────────────────
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'current'
}

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  const colorMap = {
    primary: 'border-[hsl(142,71%,28%)] border-t-transparent',
    white: 'border-white border-t-transparent',
    current: 'border-current border-t-transparent',
  }
  return (
    <span
      className={cn('block rounded-full border-2 animate-spin', sizeMap[size], colorMap[color])}
      role="status"
      aria-label="Loading"
    />
  )
}

// ─── KPI Stat Card ────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  color?: 'green' | 'orange' | 'blue' | 'purple'
  className?: string
}

const statColors = {
  green:  { bg: 'bg-[hsl(142,60%,94%)]', icon: 'text-[hsl(142,71%,28%)]', border: 'border-l-[hsl(142,71%,28%)]' },
  orange: { bg: 'bg-[hsl(25,100%,94%)]', icon: 'text-[hsl(25,90%,44%)]',  border: 'border-l-[hsl(25,90%,44%)]' },
  blue:   { bg: 'bg-[hsl(210,80%,94%)]', icon: 'text-[hsl(210,80%,38%)]', border: 'border-l-[hsl(210,80%,38%)]' },
  purple: { bg: 'bg-[hsl(270,70%,94%)]', icon: 'text-[hsl(270,60%,38%)]', border: 'border-l-[hsl(270,60%,38%)]' },
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'green', className }: StatCardProps) {
  const c = statColors[color]
  return (
    <Card className={cn('border-l-4', c.border, className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[hsl(220,10%,52%)] mb-1">{title}</p>
          <p className="text-3xl font-bold text-[hsl(220,15%,15%)] tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-[hsl(220,10%,52%)] mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-medium mt-2', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', c.bg, c.icon)}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return imageUrl ? (
    <img
      src={imageUrl}
      alt={name}
      className={cn('rounded-full object-cover border-2 border-white shadow-sm', sizeMap[size])}
    />
  ) : (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        'bg-gradient-to-br from-[hsl(142,71%,28%)] to-[hsl(142,71%,40%)]',
        sizeMap[size]
      )}
    >
      {initials}
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-[hsl(220,13%,90%)]" />
      {label && <span className="text-xs text-[hsl(220,10%,55%)] font-medium">{label}</span>}
      <div className="flex-1 h-px bg-[hsl(220,13%,90%)]" />
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[hsl(142,50%,94%)] flex items-center justify-center text-[hsl(142,71%,28%)] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[hsl(220,15%,20%)] mb-2">{title}</h3>
      {description && <p className="text-sm text-[hsl(220,10%,52%)] max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number // 0–100
  color?: 'green' | 'orange' | 'blue'
  showLabel?: boolean
  height?: 'sm' | 'md'
}

export function ProgressBar({ value, color = 'green', showLabel = false, height = 'md' }: ProgressBarProps) {
  const colorMap = {
    green:  'bg-[hsl(142,71%,28%)]',
    orange: 'bg-[hsl(25,90%,44%)]',
    blue:   'bg-[hsl(210,80%,38%)]',
  }
  const h = height === 'sm' ? 'h-1.5' : 'h-2.5'
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex-1 bg-[hsl(220,13%,92%)] rounded-full overflow-hidden', h)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorMap[color])}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-semibold text-[hsl(220,15%,30%)] w-10 text-right">{value}%</span>}
    </div>
  )
}
