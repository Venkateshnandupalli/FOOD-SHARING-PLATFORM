import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Leaf, Heart, Truck, BarChart3, MapPin, Clock, Shield,
  ArrowRight, Star, CheckCircle, ChevronDown, Menu, X,
  Users, Package, Zap, Globe
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { formatNumber } from '@/lib/utils'

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

// ─── Stats ────────────────────────────────────────────────────────────────────
const PLATFORM_STATS = [
  { label: 'Meals Supported', value: 284700, suffix: '+', icon: Heart, color: '#22c55e' },
  { label: 'Food Rescued', value: 142, suffix: 'T+', icon: Package, color: '#f97316' },
  { label: 'Active Partners', value: 320, suffix: '+', icon: Users, color: '#3b82f6' },
  { label: 'Cities Covered', value: 18, suffix: '', icon: Globe, color: '#a855f7' },
]

// ─── Steps ────────────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'List Surplus Food',
    description: 'Restaurants, hotels, and households post available food with quantity, type, and pickup window in under 2 minutes.',
    icon: Package,
    color: 'hsl(142,71%,28%)',
    bg: 'hsl(142,60%,94%)',
  },
  {
    step: '02',
    title: 'Smart AI Matching',
    description: 'Our algorithm scores nearby verified organisations using distance, expiry urgency, capacity, and reliability.',
    icon: Zap,
    color: 'hsl(25,90%,44%)',
    bg: 'hsl(25,100%,94%)',
  },
  {
    step: '03',
    title: 'Coordinate Pickup',
    description: 'Volunteers receive assignments with OTP verification, navigation, and real-time status updates.',
    icon: Truck,
    color: 'hsl(195,85%,41%)',
    bg: 'hsl(195,85%,92%)',
  },
  {
    step: '04',
    title: 'Track Impact',
    description: 'Every delivery is logged. See food rescued, meals supported, and environmental impact in live dashboards.',
    icon: BarChart3,
    color: 'hsl(270,60%,38%)',
    bg: 'hsl(270,70%,94%)',
  },
]

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Operations Manager, GreenLeaf Restaurant',
    quote: 'We used to throw away 40–60 meals every evening. SharePlate connects us with NGOs in minutes. Our waste is down 80%.',
    avatar: 'PS',
    rating: 5,
    type: 'DONOR',
  },
  {
    name: 'Father Joseph',
    role: 'Director, Hope Community Centre',
    quote: 'We receive consistent, verified donations now. The match explanations show us exactly why a donation was suggested.',
    avatar: 'FJ',
    rating: 5,
    type: 'RECIPIENT',
  },
  {
    name: 'Ananya Reddy',
    role: 'Volunteer, Kakinada Chapter',
    quote: 'The app assigns pickups, shows navigation, and lets me confirm with OTPs. It actually works, which is rare.',
    avatar: 'AR',
    rating: 5,
    type: 'VOLUNTEER',
  },
]

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-[hsl(220,13%,90%)] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(142,71%,28%)] to-[hsl(142,71%,42%)] flex items-center justify-center shadow-[0_4px_12px_hsla(142,71%,28%,0.4)]">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-[hsl(220,15%,15%)]">
            Share<span className="text-[hsl(142,71%,28%)]">Plate</span>{' '}
            <span className="text-[hsl(25,90%,44%)] font-black">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {['How It Works', 'For Donors', 'For NGOs', 'Impact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium text-[hsl(220,15%,35%)] hover:text-[hsl(142,71%,28%)] transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Join the Network
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-[hsl(220,13%,94%)] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle mobile menu"
          id="mobile-menu-toggle"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[hsl(220,13%,90%)] py-4 px-6 flex flex-col gap-4">
          {['How It Works', 'For Donors', 'For NGOs', 'Impact'].map((item) => (
            <a key={item} href="#" className="text-sm font-medium text-[hsl(220,15%,35%)]" onClick={() => setMobileOpen(false)}>
              {item}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-[hsl(220,13%,92%)]">
            <Link to="/login"><Button variant="outline" fullWidth>Sign In</Button></Link>
            <Link to="/register"><Button variant="primary" fullWidth>Join the Network</Button></Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[hsl(142,50%,97%)] via-[hsl(40,20%,97%)] to-[hsl(25,50%,96%)]" />
        <div
          className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(142,71%,28%) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 left-0 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(25,95%,53%) 0%, transparent 70%)' }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(hsl(142,71%,28%) 1px, transparent 1px), linear-gradient(90deg, hsl(142,71%,28%) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container pt-28 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Label badge */}
          <div className="animate-fade-up flex justify-center mb-6">
            <Badge variant="success" dot className="px-4 py-1.5 text-sm font-semibold">
              🌱 AI-Powered Food Redistribution Platform
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 mb-6 text-[hsl(220,15%,12%)] leading-tight">
            Rescue Surplus Food.
            <br />
            <span style={{
              background: 'linear-gradient(135deg, hsl(142,71%,28%) 0%, hsl(142,71%,42%) 50%, hsl(25,90%,44%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Deliver It Where
            </span>
            <br />
            It Matters Most.
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up delay-200 text-xl text-[hsl(220,10%,45%)] max-w-2xl mx-auto mb-10 leading-relaxed">
            SharePlate AI connects verified food donors, recipient organisations, and volunteers
            using geospatial matching and expiry-aware algorithms — reducing food waste and
            fighting hunger simultaneously.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/register?role=DONOR">
              <Button size="xl" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Donate Food
              </Button>
            </Link>
            <Link to="/register?role=RECIPIENT">
              <Button size="xl" variant="outline" leftIcon={<Heart className="w-5 h-5" />}>
                Register Organisation
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-up delay-400 flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(220,10%,50%)]">
            {[
              { icon: Shield, text: 'Verified Organisations Only' },
              { icon: CheckCircle, text: 'OTP-Confirmed Deliveries' },
              { icon: Clock, text: 'Expiry-Aware Matching' },
              { icon: MapPin, text: 'PostGIS Geospatial' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-[hsl(142,71%,28%)]" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-20">
          <a href="#stats" className="flex flex-col items-center gap-2 text-[hsl(220,10%,60%)] hover:text-[hsl(142,71%,28%)] transition-colors animate-float">
            <span className="text-xs font-medium tracking-widest uppercase">Explore</span>
            <ChevronDown className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Stats Section ────────────────────────────────────────────────────────────
function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.3 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const counts = [
    useCountUp(284700, 2000, inView),
    useCountUp(142, 2000, inView),
    useCountUp(320, 1800, inView),
    useCountUp(18, 1500, inView),
  ]

  return (
    <section id="stats" ref={sectionRef} className="py-20 bg-[hsl(142,71%,28%)] relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {PLATFORM_STATS.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center text-white">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-black tracking-tight mb-1">
                  {counts[i] >= 1000 ? formatNumber(counts[i]) : counts[i]}
                  {stat.suffix}
                </div>
                <div className="text-sm text-white/75 font-medium">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="success" className="mb-4">Simple 4-Step Process</Badge>
          <h2 className="text-[hsl(220,15%,12%)] mb-4">How SharePlate AI Works</h2>
          <p className="text-[hsl(220,10%,45%)] text-lg max-w-2xl mx-auto">
            From surplus food to community impact — automated, transparent, and trackable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[hsl(142,60%,85%)] via-[hsl(25,100%,85%)] to-[hsl(270,70%,88%)]" />

          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.step} className={`animate-fade-up delay-${(i + 1) * 100} h-full`}>
                <div className="relative flex flex-col items-center text-center p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-full">
                  {/* Step number */}
                  <div className="absolute -top-4 left-6 w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                    style={{ background: step.color }}>
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mt-2 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: step.bg, color: step.color }}>
                    <Icon className="w-7 h-7" />
                  </div>

                  <h4 className="font-bold text-[hsl(220,15%,15%)] mb-2">{step.title}</h4>
                  <p className="text-sm text-[hsl(220,10%,50%)] leading-relaxed">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── For Donors / For NGOs ────────────────────────────────────────────────────
function RoleCards() {
  return (
    <section id="for-donors" className="py-32 bg-[hsl(40,20%,97%)]">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Donor card */}
          <div className="flex flex-col rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-lg group hover:shadow-2xl transition-all duration-400">
            <div className="h-3 bg-gradient-to-r from-green-700 to-green-500" />
            <div className="p-10 flex flex-col flex-1">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(142,60%,94%)] flex items-center justify-center mb-5">
                <Package className="w-6 h-6 text-[hsl(142,71%,28%)]" />
              </div>
              <Badge variant="success" className="mb-3">For Food Donors</Badge>
              <h3 className="text-[hsl(220,15%,12%)] mb-3">Turn Surplus Into Impact</h3>
              <p className="text-[hsl(220,10%,45%)] mb-6 leading-relaxed">
                Restaurants, hotels, bakeries, and households can list surplus food in under 2 minutes.
                Our system finds the best nearby recipient automatically.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'List food in 2 minutes with photo upload',
                  'See live match recommendations with scores',
                  'Track pickup status and get delivery confirmation',
                  'Download monthly CSR impact reports',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[hsl(220,15%,25%)]">
                    <CheckCircle className="w-4 h-4 text-[hsl(142,71%,28%)] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <Link to="/register?role=DONOR">
                  <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Start Donating
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* NGO card */}
          <div id="for-ngos" className="flex flex-col rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-lg group hover:shadow-2xl transition-all duration-400">
            <div className="h-3 bg-gradient-to-r from-orange-500 to-orange-400" />
            <div className="p-10 flex flex-col flex-1">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(25,100%,94%)] flex items-center justify-center mb-5">
                <Heart className="w-6 h-6 text-[hsl(25,90%,44%)]" />
              </div>
              <Badge variant="warning" className="mb-3">For Recipient Organisations</Badge>
              <h3 className="text-[hsl(220,15%,12%)] mb-3">Receive What Your Community Needs</h3>
              <p className="text-[hsl(220,10%,45%)] mb-6 leading-relaxed">
                NGOs, food banks, shelters, and community kitchens get matched with nearby donations
                based on your current demand, dietary needs, and capacity.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Publish daily food requirements',
                  'Get priority-ranked donation matches',
                  'One-click acceptance with OTP pickup',
                  'Track all deliveries and unmet demand',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[hsl(220,15%,25%)]">
                    <CheckCircle className="w-4 h-4 text-[hsl(25,90%,44%)] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <Link to="/register?role=RECIPIENT">
                  <Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Register Organisation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container">
        <div className="text-center mb-14">
          <Badge variant="info" className="mb-4">Community Stories</Badge>
          <h2 className="text-[hsl(220,15%,12%)]">Trusted Across the Network</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className={`animate-fade-up delay-${(i + 1) * 100} group`}>
              <div className="p-6 rounded-2xl border border-[hsl(220,13%,92%)] bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[hsl(38,95%,50%)] text-[hsl(38,95%,50%)]" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[hsl(220,10%,35%)] text-sm leading-relaxed mb-5 flex-1 italic">
                  "{t.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-[hsl(220,13%,93%)]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(142,71%,28%)] to-[hsl(142,71%,42%)] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[hsl(220,15%,20%)]">{t.name}</p>
                    <p className="text-xs text-[hsl(220,10%,52%)]">{t.role}</p>
                  </div>
                  <Badge
                    variant={t.type === 'DONOR' ? 'success' : t.type === 'RECIPIENT' ? 'warning' : 'info'}
                    className="ml-auto text-[10px]"
                  >
                    {t.type}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Impact Section ───────────────────────────────────────────────────────────
function ImpactSection() {
  return (
    <section id="impact" className="py-24 bg-[hsl(40,20%,97%)]">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-[hsl(142,71%,28%)] to-[hsl(142,71%,20%)] p-1">
            <div className="rounded-[22px] bg-[hsl(142,71%,10%)] p-10 text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute right-0 top-0 w-96 h-96 opacity-10"
                style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

              <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <Badge className="mb-4 bg-white/15 text-white border-white/20">🌍 Environmental Impact</Badge>
                  <h2 className="text-4xl font-black mb-4 text-white leading-tight">
                    Food waste produces<br />
                    <span className="text-[hsl(25,95%,65%)]">8–10% of global</span><br />
                    greenhouse emissions.
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-6">
                    Every kilogram of food rescued by SharePlate AI avoids landfill decomposition
                    and the associated methane emissions. Our platform measures and reports this
                    impact transparently.
                  </p>
                  <Link to="/register">
                    <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Join the Movement
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Food Diverted', value: '142+ Tonnes', icon: '♻️' },
                    { label: 'Meals Enabled', value: '284K+', icon: '🍽️' },
                    { label: 'Avg Response', value: '< 8 min', icon: '⚡' },
                    { label: 'Success Rate', value: '91.4%', icon: '✅' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/10">
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <div className="text-2xl font-black text-white mb-1">{item.value}</div>
                      <div className="text-xs text-white/60">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-[hsl(220,15%,12%)] mb-4">
            Ready to Rescue Food and
            <br />
            <span style={{
              background: 'linear-gradient(135deg, hsl(142,71%,28%) 0%, hsl(25,90%,44%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Make Real Impact?
            </span>
          </h2>
          <p className="text-[hsl(220,10%,45%)] text-lg mb-10">
            Join 320+ organisations already using SharePlate AI to connect surplus food
            with communities that need it — verified, tracked, and transparent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register?role=DONOR">
              <Button size="xl" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Donating Food
              </Button>
            </Link>
            <Link to="/register?role=RECIPIENT">
              <Button size="xl" variant="outline">
                Register as NGO / Shelter
              </Button>
            </Link>
            <Link to="/register?role=VOLUNTEER">
              <Button size="xl" variant="ghost" leftIcon={<Truck className="w-5 h-5" />}>
                Volunteer
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[hsl(220,15%,12%)] text-white py-16">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(142,71%,28%)] to-[hsl(142,71%,42%)] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">
                Share<span className="text-[hsl(142,60%,55%)]">Plate</span>{' '}
                <span className="text-[hsl(25,90%,60%)] font-black">AI</span>
              </span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">
              Intelligent surplus food redistribution. Connecting donors, verified organisations,
              and volunteers with geospatial AI.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h6 className="font-semibold text-sm mb-4 text-white/80">Platform</h6>
            <ul className="space-y-2.5">
              {['For Donors', 'For NGOs', 'For Volunteers', 'Analytics'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/50 hover:text-white/80 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h6 className="font-semibold text-sm mb-4 text-white/80">Legal & Safety</h6>
            <ul className="space-y-2.5">
              {['Food Safety Policy', 'Privacy Policy', 'Terms of Service', 'Verification Process'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/50 hover:text-white/80 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © 2025 SharePlate AI. Built for SDG 2: Zero Hunger and SDG 12.3: Reduce Food Waste.
          </p>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Shield className="w-4 h-4" />
            All organisations are verified before accessing donations.
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <>
      <title>SharePlate AI – Intelligent Surplus Food Redistribution Platform</title>
      <meta name="description" content="SharePlate AI connects verified food donors, NGOs, and volunteers using AI-powered geospatial matching. Reduce food waste. Fight hunger. Track real impact." />

      <Navbar />
      <main>
        <Hero />
        <StatsSection />
        <HowItWorksSection />
        <RoleCards />
        <TestimonialsSection />
        <ImpactSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
