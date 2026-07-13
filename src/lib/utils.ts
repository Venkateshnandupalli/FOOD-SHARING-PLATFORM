import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns'

// ─── Tailwind class merger ───────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date helpers ────────────────────────────────────────────────────
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy, HH:mm'): string {
  return format(new Date(date), fmt)
}

export function minutesUntil(date: string | Date): number {
  return differenceInMinutes(new Date(date), new Date())
}

export function urgencyLabel(useBeforeIso: string): {
  label: string
  color: string
  risk: 'critical' | 'high' | 'medium' | 'low'
} {
  const mins = minutesUntil(useBeforeIso)
  if (mins < 0)   return { label: 'Expired', color: '#6b7280', risk: 'critical' }
  if (mins < 60)  return { label: `${mins}m left`, color: '#ef4444', risk: 'critical' }
  if (mins < 180) return { label: `${Math.floor(mins / 60)}h ${mins % 60}m left`, color: '#f59e0b', risk: 'high' }
  if (mins < 360) return { label: `${Math.floor(mins / 60)}h left`, color: '#f97316', risk: 'medium' }
  return { label: `${Math.floor(mins / 60)}h left`, color: '#22c55e', risk: 'low' }
}

// ─── Number formatting ───────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatKg(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg.toFixed(0)}kg`
}

// ─── Distance ────────────────────────────────────────────────────────
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Role helpers ────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'DONOR' | 'RECIPIENT' | 'VOLUNTEER' | 'ANALYST'

export function roleDashboardPath(role: UserRole): string {
  const map: Record<UserRole, string> = {
    ADMIN:     '/admin',
    DONOR:     '/donor',
    RECIPIENT: '/recipient',
    VOLUNTEER: '/volunteer',
    ANALYST:   '/analytics',
  }
  return map[role] ?? '/'
}

export function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    ADMIN:     'Administrator',
    DONOR:     'Food Donor',
    RECIPIENT: 'Recipient Organisation',
    VOLUNTEER: 'Volunteer',
    ANALYST:   'Analyst',
  }
  return map[role] ?? role
}

// ─── OTP generator (client-side preview only; real OTPs generated server-side) ──
export function generatePreviewOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ─── Truncate ────────────────────────────────────────────────────────
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}
