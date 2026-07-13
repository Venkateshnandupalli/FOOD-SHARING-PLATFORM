import React, { useEffect, useState } from 'react'
import { MapPin, Heart, Package, Clock, ArrowRight, CheckCircle, Star } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { StatCard, Card, Badge, Button, ProgressBar, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { organizationService } from '@/services/organizationService'
import { urgencyLabel } from '@/lib/utils'

// ─── Mock nearby donations ────────────────────────────────────────────────────
const NEARBY_DONATIONS = [
  {
    id: '1', title: 'Veg Rice Meals', servings: 40, distance: 2.3,
    use_before: new Date(Date.now() + 80 * 60 * 1000).toISOString(),
    match_score: 91, dietary: 'VEGETARIAN', donor_name: 'GreenLeaf Restaurant',
    explanation: ['2.3 km away', '40 vegetarian servings', '94% pickup rate'],
  },
  {
    id: '2', title: 'Bread & Pastries', servings: 60, distance: 3.8,
    use_before: new Date(Date.now() + 200 * 60 * 1000).toISOString(),
    match_score: 78, dietary: 'VEGETARIAN', donor_name: 'City Bakery',
    explanation: ['3.8 km away', '60 servings', 'High reliability donor'],
  },
  {
    id: '3', title: 'Mixed Meal Boxes', servings: 25, distance: 5.1,
    use_before: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    match_score: 65, dietary: 'NON_VEGETARIAN', donor_name: 'Hotel Grand',
    explanation: ['5.1 km away', 'Expiring soon', 'Requires confirmation'],
  },
]

export default function RecipientDashboard() {
  const { profile } = useAuthStore()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const [isLoading, setIsLoading] = useState(true)
  const [hasOrg, setHasOrg] = useState(false)

  useEffect(() => {
    async function checkOrg() {
      if (!profile) return
      try {
        const org = await organizationService.getOrganizationByOwnerId(profile.id)
        if (org) setHasOrg(true)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    checkOrg()
  }, [profile])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!hasOrg) {
    return <Navigate to="/recipient/onboarding" replace />
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(220,15%,12%)]">
            Welcome back, {firstName} 🏠
          </h2>
          <p className="text-[hsl(220,10%,52%)] text-sm mt-1">
            Here are the best food matches near your organisation right now.
          </p>
        </div>
        <Link to="/recipient/requirements">
          <Button variant="secondary" leftIcon={<Heart className="w-4 h-4" />}>
            Post Requirement
          </Button>
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Need"
          value="120"
          subtitle="Meals required today"
          icon={<Heart className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="Donations Received"
          value="847"
          subtitle="This month"
          icon={<Package className="w-5 h-5" />}
          color="green"
          trend={{ value: 22, label: 'vs last month' }}
        />
        <StatCard
          title="Fulfilment Rate"
          value="87.3%"
          subtitle="Demand fulfilled"
          icon={<CheckCircle className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Avg Response"
          value="4.2 min"
          subtitle="Time to accept"
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* ── Capacity Gauge ── */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm font-medium text-[hsl(220,10%,52%)] mb-3">Storage Capacity</p>
          <p className="text-3xl font-black text-[hsl(220,15%,15%)] mb-2">68%</p>
          <ProgressBar value={68} color="green" showLabel />
          <p className="text-xs text-[hsl(220,10%,55%)] mt-2">136 / 200 meals capacity used</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-[hsl(220,10%,52%)] mb-3">Today's Supply</p>
          <p className="text-3xl font-black text-[hsl(142,71%,28%)] mb-2">+105</p>
          <p className="text-xs text-[hsl(220,10%,55%)]">Meals incoming from 3 accepted donations</p>
          <div className="mt-3 space-y-1.5">
            {['Rice (40)', 'Bread (25)', 'Mixed boxes (40)'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-[hsl(220,10%,45%)]">
                <CheckCircle className="w-3 h-3 text-[hsl(142,71%,28%)]" />
                {item}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-sm font-medium text-[hsl(220,10%,52%)] mb-3">Unmet Demand</p>
          <p className="text-3xl font-black text-[hsl(25,90%,44%)] mb-2">15</p>
          <p className="text-xs text-[hsl(220,10%,55%)]">Meals still needed today</p>
          <div className="mt-3">
            <Badge variant="warning" dot>Searching nearby donors…</Badge>
          </div>
        </Card>
      </div>

      {/* ── Nearby Donations ── */}
      <Card padding="none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(220,13%,92%)]">
          <div>
            <h4 className="font-semibold text-[hsl(220,15%,15%)]">Recommended Donations Near You</h4>
            <p className="text-xs text-[hsl(220,10%,55%)] mt-0.5">Ranked by match score — distance, urgency, and capacity</p>
          </div>
          <Link to="/recipient/browse">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Browse Map
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-[hsl(220,13%,94%)]">
          {NEARBY_DONATIONS.map((d) => {
            const urgency = urgencyLabel(d.use_before)
            const scoreColor = d.match_score >= 85 ? 'text-[hsl(142,71%,28%)]' : d.match_score >= 70 ? 'text-[hsl(38,80%,38%)]' : 'text-[hsl(220,10%,45%)]'
            return (
              <div key={d.id} className="px-6 py-4 hover:bg-[hsl(220,13%,98%)] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[hsl(220,15%,15%)]">{d.title}</span>
                      <Badge variant={d.dietary === 'VEGETARIAN' ? 'success' : 'warning'} className="text-[10px]">
                        {d.dietary}
                      </Badge>
                    </div>
                    <p className="text-sm text-[hsl(220,10%,45%)] mb-2">{d.donor_name}</p>

                    <div className="flex flex-wrap gap-3 text-xs text-[hsl(220,10%,50%)]">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.distance} km</span>
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" />{d.servings} servings</span>
                      <span className="flex items-center gap-1" style={{ color: urgency.color }}>
                        <Clock className="w-3 h-3" />{urgency.label}
                      </span>
                    </div>

                    {/* Match explanation */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {d.explanation.map((e) => (
                        <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(220,13%,94%)] text-[hsl(220,10%,45%)]">{e}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {/* Match score */}
                    <div className="text-right">
                      <p className={`text-2xl font-black ${scoreColor}`}>{d.match_score}%</p>
                      <p className="text-[10px] text-[hsl(220,10%,55%)]">Match score</p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/recipient/donations/${d.id}`}>
                        <Button variant="ghost" size="sm">Details</Button>
                      </Link>
                      <Button variant="secondary" size="sm">Accept</Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
