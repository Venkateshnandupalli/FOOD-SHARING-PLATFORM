import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Leaf, Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft, ArrowRight,
  Building2, Heart, Truck, BarChart3, CheckCircle
} from 'lucide-react'
import { Button, Input, Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { UserRole } from '@/types/database'

// ─── Role selection data ──────────────────────────────────────────────────────
const ROLES = [
  {
    value: 'DONOR' as UserRole,
    label: 'Food Donor',
    description: 'Restaurants, hotels, households with surplus food',
    icon: Building2,
    color: 'hsl(142,71%,28%)',
    bg: 'hsl(142,60%,94%)',
    badge: 'Most Common',
    badgeVariant: 'success' as const,
  },
  {
    value: 'RECIPIENT' as UserRole,
    label: 'Recipient Organisation',
    description: 'NGOs, food banks, shelters, community kitchens',
    icon: Heart,
    color: 'hsl(25,90%,44%)',
    bg: 'hsl(25,100%,94%)',
    badge: 'Requires Verification',
    badgeVariant: 'warning' as const,
  },
  {
    value: 'VOLUNTEER' as UserRole,
    label: 'Volunteer',
    description: 'Coordinate pickups and deliveries',
    icon: Truck,
    color: 'hsl(195,85%,41%)',
    bg: 'hsl(195,85%,92%)',
    badge: null,
    badgeVariant: 'info' as const,
  },
  {
    value: 'ANALYST' as UserRole,
    label: 'Analyst / Viewer',
    description: 'View aggregated impact data and reports',
    icon: BarChart3,
    color: 'hsl(270,60%,38%)',
    bg: 'hsl(270,70%,94%)',
    badge: null,
    badgeVariant: 'purple' as const,
  },
]

// ─── Schema ───────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  agree_terms: z.boolean().refine((v) => v, 'You must agree to the terms'),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type RegisterForm = z.infer<typeof registerSchema>

// ─── Step 1: Role selection ────────────────────────────────────────────────────
function RoleSelection({ selected, onSelect }: { selected: UserRole | null; onSelect: (r: UserRole) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-[hsl(220,15%,12%)] mb-1">I am joining as a…</h3>
        <p className="text-sm text-[hsl(220,10%,52%)]">Select the role that best describes you</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ROLES.map((role) => {
          const Icon = role.icon
          const isSelected = selected === role.value
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onSelect(role.value)}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 cursor-pointer',
                isSelected
                  ? 'border-[hsl(142,71%,28%)] bg-[hsl(142,50%,97%)] shadow-[0_0_0_4px_hsla(142,71%,28%,0.12)]'
                  : 'border-[hsl(220,13%,90%)] bg-white hover:border-[hsl(142,71%,50%)] hover:bg-[hsl(142,50%,98%)]'
              )}
              id={`role-${role.value.toLowerCase()}`}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                style={{ background: isSelected ? role.color : role.bg, color: isSelected ? 'white' : role.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-[hsl(220,15%,15%)]">{role.label}</span>
                  {role.badge && <Badge variant={role.badgeVariant} className="text-[10px] py-0">{role.badge}</Badge>}
                </div>
                <p className="text-xs text-[hsl(220,10%,52%)] truncate">{role.description}</p>
              </div>
              {isSelected && <CheckCircle className="w-5 h-5 text-[hsl(142,71%,28%)] shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Account details ───────────────────────────────────────────────────
function AccountDetails({ register: reg, errors, showPassword, setShowPassword }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any; errors: any; showPassword: boolean; setShowPassword: (v: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-[hsl(220,15%,12%)] mb-1">Create your account</h3>
        <p className="text-sm text-[hsl(220,10%,52%)]">You'll use these credentials to sign in</p>
      </div>

      <Input
        label="Full Name"
        id="reg-full-name"
        placeholder="Venkatesh Reddy"
        leftIcon={<User className="w-4 h-4" />}
        error={errors.full_name?.message}
        {...reg('full_name')}
      />
      <Input
        label="Email Address"
        type="email"
        id="reg-email"
        placeholder="you@example.com"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        {...reg('email')}
      />
      <Input
        label="Phone Number"
        type="tel"
        id="reg-phone"
        placeholder="+91 98765 43210 (optional)"
        leftIcon={<Phone className="w-4 h-4" />}
        error={errors.phone?.message}
        {...reg('phone')}
      />
      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        id="reg-password"
        placeholder="Min. 8 characters"
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer" aria-label="Toggle password">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        error={errors.password?.message}
        {...reg('password')}
      />
      <Input
        label="Confirm Password"
        type={showPassword ? 'text' : 'password'}
        id="reg-confirm-password"
        placeholder="Repeat your password"
        leftIcon={<Lock className="w-4 h-4" />}
        error={errors.confirm_password?.message}
        {...reg('confirm_password')}
      />

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          id="reg-agree-terms"
          className="mt-0.5 w-4 h-4 rounded border-[hsl(220,13%,80%)] text-[hsl(142,71%,28%)] cursor-pointer accent-[hsl(142,71%,28%)]"
          {...reg('agree_terms')}
        />
        <span className="text-sm text-[hsl(220,10%,45%)]">
          I agree to the{' '}
          <a href="#" className="text-[hsl(142,71%,28%)] hover:underline font-medium">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[hsl(142,71%,28%)] hover:underline font-medium">Privacy Policy</a>.
          I confirm all food donations and organisational details will be accurate.
        </span>
      </label>
      {errors.agree_terms && (
        <p className="text-xs text-red-500">{errors.agree_terms.message}</p>
      )}
    </div>
  )
}

// ─── Main Register Page ───────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRole = (searchParams.get('role') as UserRole) || null

  const [step, setStep] = useState(initialRole ? 2 : 1)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterForm) {
    if (!selectedRole) {
      toast.error('Please select a role first')
      setStep(1)
      return
    }

    setIsLoading(true)
    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name, role: selectedRole },
        },
      })

      if (signupError) throw signupError

      // 2. Profile record is automatically created via Supabase database trigger
      if (authData.user) {
        // Wait a small moment for the trigger to finish
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Refresh the auth store profile so it's populated immediately
        const { refreshProfile } = await import('@/store/authStore').then(m => m.useAuthStore.getState())
        await refreshProfile()
      }

      toast.success('Account created! Welcome to SharePlate AI.')

      const roleRoutes: Record<UserRole, string> = {
        ADMIN: '/admin',
        DONOR: '/donor',
        RECIPIENT: '/recipient',
        VOLUNTEER: '/volunteer',
        ANALYST: '/analytics',
      }
      navigate(roleRoutes[selectedRole])
    } catch (err: any) {
      console.error('Registration Error:', err)
      function getErrorMessage(e: unknown): string {
        if (e instanceof Error && e.message) {
          if (e.message === '{}') return 'An unexpected error occurred.';
          return e.message;
        }
        if (typeof e === 'string' && e.trim()) {
          if (e === '{}') return 'An unexpected error occurred.';
          return e;
        }
        if (e && typeof e === 'object') {
          const m = (e as any).message || (e as any).error_description || (e as any).detail;
          if (typeof m === 'string' && m.trim()) {
            if (m === '{}') return 'An unexpected error occurred.';
            return m;
          }
          try {
            const str = JSON.stringify(e);
            if (str === '{}') return 'An unexpected error occurred.';
            return str;
          } catch { return 'Registration failed.'; }
        }
        return 'Registration failed.';
      }

      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'github') {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || 'Failed to authenticate')
    }
  }

  const roleInfo = ROLES.find((r) => r.value === selectedRole)

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(142,71%,20%)] to-[hsl(142,71%,12%)] flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5 no-underline mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">
              SharePlate <span className="text-[hsl(25,95%,65%)] font-black">AI</span>
            </span>
          </Link>

          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Join the network<br />
            <span className="text-[hsl(25,95%,65%)]">fighting food waste</span>
          </h2>
          <p className="text-white/65 leading-relaxed max-w-sm mb-10">
            Your registration helps connect surplus food with communities that need it.
            Every account on the platform has a purpose.
          </p>

          {/* Selected role preview */}
          {roleInfo && (
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: roleInfo.color }}
                >
                  <roleInfo.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{roleInfo.label}</p>
                  <p className="text-white/55 text-xs">{roleInfo.description}</p>
                </div>
              </div>
              {roleInfo.value === 'RECIPIENT' && (
                <p className="text-xs text-[hsl(25,95%,75%)]">
                  ℹ️ Organisation accounts require document verification before accessing large donations.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="relative text-white/40 text-xs">
          By joining you agree to our food safety guidelines and community standards.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-[hsl(40,20%,97%)] overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[hsl(142,71%,28%)] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">SharePlate AI</span>
          </div>

          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[hsl(220,10%,52%)] hover:text-[hsl(142,71%,28%)] transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200',
                  step >= s
                    ? 'bg-[hsl(142,71%,28%)] text-white'
                    : 'bg-[hsl(220,13%,92%)] text-[hsl(220,10%,52%)]'
                )}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 2 && (
                  <div className={cn(
                    'flex-1 h-0.5 transition-all duration-300',
                    step > s ? 'bg-[hsl(142,71%,28%)]' : 'bg-[hsl(220,13%,90%)]'
                  )} />
                )}
              </React.Fragment>
            ))}
            <span className="text-xs text-[hsl(220,10%,52%)] ml-2">Step {step} of 2</span>
          </div>

          <Card className="p-8 shadow-md">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {step === 1 && (
                <RoleSelection selected={selectedRole} onSelect={(r) => setSelectedRole(r)} />
              )}
              {step === 2 && (
                <AccountDetails
                  register={register}
                  errors={errors}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              )}

              {/* Navigation buttons */}
              <div className={cn('flex gap-3 pt-2', step === 2 && 'flex-col')}>
                {step === 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setStep(1)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="self-start"
                    id="reg-back-btn"
                  >
                    Change role
                  </Button>
                )}

                {step === 1 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!selectedRole}
                    onClick={() => setStep(2)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    id="reg-next-btn"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    id="reg-submit-btn"
                  >
                    Create Account
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => handleOAuthLogin('google')}
                  type="button"
                  className="bg-white"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            </div>
          </Card>

          <p className="text-center text-sm text-[hsl(220,10%,52%)] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[hsl(142,71%,28%)] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
