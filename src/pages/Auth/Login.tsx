import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { UserRole } from '@/types/database'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err.trim()) return err
  if (err && typeof err === 'object') {
    const maybeMessage = (err as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage
    const maybeError = (err as { error?: unknown }).error
    if (typeof maybeError === 'string' && maybeError.trim()) return maybeError
  }
  return 'Login failed. Please try again.'
}

function normalizeRole(value: unknown): UserRole {
  const role = typeof value === 'string' ? value.toUpperCase() : ''
  return ['ADMIN', 'DONOR', 'RECIPIENT', 'VOLUNTEER', 'ANALYST'].includes(role)
    ? (role as UserRole)
    : 'DONOR'
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      let role: UserRole = 'DONOR'

      const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle()

      if (profileError) {
        console.warn('Profile lookup warning:', profileError)
      }

      if (profile?.role) {
        role = normalizeRole(profile.role)
      } else {
        const metadataRole = authData.user.user_metadata?.role
        role = normalizeRole(metadataRole)

        const { error: insertError } = await (supabase.from('profiles') as any).insert({
          auth_user_id: authData.user.id,
          full_name: authData.user.user_metadata?.full_name || authData.user.email || 'User',
          role,
          is_active: true,
        })

        if (insertError) {
          console.warn('Profile create warning:', insertError)
        }
      }

      toast.success('Welcome back!')

      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin',
        DONOR: '/donor',
        RECIPIENT: '/recipient',
        VOLUNTEER: '/volunteer',
        ANALYST: '/analytics',
      }

      const redirect = searchParams.get('redirect') || roleRoutes[role] || '/donor'
      navigate(redirect)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(142,71%,20%)] to-[hsl(142,71%,12%)] flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5 no-underline mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">
              SharePlate <span className="text-[hsl(25,95%,65%)] font-black">AI</span>
            </span>
          </Link>

          <h1 className="text-5xl font-black text-white leading-tight mb-6">
            Every meal
            <br />
            <span className="text-[hsl(25,95%,65%)]">rescued</span>
            <br />
            matters.
          </h1>
          <p className="text-white/65 text-lg leading-relaxed max-w-sm">
            Join 320+ organisations connecting surplus food with communities that need it most.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-4">
          {[
            { value: '284K+', label: 'Meals supported' },
            { value: '91.4%', label: 'Delivery success rate' },
            { value: '142T+', label: 'Food rescued' },
            { value: '< 8min', label: 'Avg match time' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/10">
              <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-white/55">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-[hsl(40,20%,97%)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[hsl(142,71%,28%)] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-[hsl(220,15%,15%)]">
              SharePlate <span className="text-[hsl(25,90%,44%)] font-black">AI</span>
            </span>
          </div>

          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[hsl(220,10%,52%)] hover:text-[hsl(142,71%,28%)] transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <h2 className="text-3xl font-black text-[hsl(220,15%,12%)] mb-2">Welcome back</h2>
            <p className="text-[hsl(220,10%,52%)]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[hsl(142,71%,28%)] font-semibold hover:underline">
                Join the network
              </Link>
            </p>
          </div>

          <Card className="p-8 shadow-md">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <Input
                label="Email address"
                type="email"
                id="login-email"
                placeholder="you@example.com"
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                placeholder="Your password"
                autoComplete="current-password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-[hsl(142,71%,28%)] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                id="login-submit-btn"
              >
                Sign In to SharePlate
              </Button>
            </form>
          </Card>

          <p className="text-center text-xs text-[hsl(220,10%,55%)] mt-6">
            By signing in, you agree to our{' '}
            <a href="#" className="text-[hsl(142,71%,28%)] hover:underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-[hsl(142,71%,28%)] hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
