import React, { useState, useEffect } from 'react'
import {
  Package, TrendingUp, Clock, CheckCircle,
  Plus, ArrowRight, Leaf, AlertCircle, Users, Heart, Star
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard, Card, Badge, Button, EmptyState, ProgressBar } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { donationService } from '@/services/donationService'
import { deliveryService } from '@/services/deliveryService'
import { RatingModal } from '@/components/RatingModal'
import { urgencyLabel, formatDate } from '@/lib/utils'

// ─── Mock data (replaced by API data in Phase 2) ──────────────────────────────
const MOCK_DONATIONS = [
  { id: '1', title: 'Vegetarian Rice Meals', quantity: 40, unit: 'servings', status: 'MATCHED',    use_before: new Date(Date.now() + 80 * 60 * 1000).toISOString(),  category: 'COOKED_MEALS' },
  { id: '2', title: 'Whole Wheat Bread',     quantity: 25, unit: 'packs',    status: 'AVAILABLE',  use_before: new Date(Date.now() + 190 * 60 * 1000).toISOString(), category: 'BAKERY' },
  { id: '3', title: 'Mixed Fruit Salad',     quantity: 12, unit: 'kg',       status: 'COLLECTED',  use_before: new Date(Date.now() + 30 * 60 * 1000).toISOString(),  category: 'FRUITS_VEGETABLES' },
  { id: '4', title: 'Dal & Roti Set',        quantity: 60, unit: 'servings', status: 'DELIVERED',  use_before: new Date(Date.now() - 60 * 60 * 1000).toISOString(),  category: 'COOKED_MEALS' },
]

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' | 'purple' }> = {
  DRAFT:          { label: 'Draft',         variant: 'default' },
  AVAILABLE:      { label: 'Available',     variant: 'info' },
  MATCHED:        { label: 'Matched',       variant: 'purple' },
  ACCEPTED:       { label: 'Accepted',      variant: 'success' },
  PICKUP_ASSIGNED:{ label: 'Pickup Soon',   variant: 'warning' },
  COLLECTED:      { label: 'Collected',     variant: 'warning' },
  DELIVERED:      { label: 'Delivered ✓',   variant: 'success' },
  EXPIRED:        { label: 'Expired',       variant: 'danger' },
  CANCELLED:      { label: 'Cancelled',     variant: 'danger' },
}

export default function DonorDashboard() {
  const { profile } = useAuthStore()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const [recentDonations, setRecentDonations] = useState<any[]>(MOCK_DONATIONS)
  const [activeCount, setActiveCount] = useState(3)
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [ratingTarget, setRatingTarget] = useState<{
    deliveryId: string, 
    reviewedUserId: string, 
    reviewedUserName: string,
    defaultCategory: 'FOOD_QUALITY' | 'DELIVERY_EXPERIENCE'
  } | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      if (!profile) return
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')) {
        return // stick to mock
      }
      try {
        const [donationsData, deliveriesData] = await Promise.all([
          donationService.getDonorDonations(profile.id),
          deliveryService.getDeliveriesForDonor(profile.id)
        ])
        const active = donationsData.filter(d => d.status === 'AVAILABLE' || d.status === 'MATCHED')
        setActiveCount(active.length)
        setRecentDonations(donationsData.slice(0, 4))
        setDeliveries(deliveriesData || [])
      } catch (err) {
        console.error('Dashboard load failed:', err)
      }
    }
    fetchDashboard()
  }, [profile])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(220,15%,12%)]">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-[hsl(220,10%,52%)] text-sm mt-1">
            Here's your food donation overview for today.
          </p>
        </div>
        <Link to="/donor/create">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Create Donation
          </Button>
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Donations"
          value={activeCount.toString()}
          subtitle="Currently active"
          icon={<Package className="w-5 h-5" />}
          color="green"
          trend={{ value: 12, label: 'vs last week' }}
        />
        <StatCard
          title="Meals Supported"
          value="1,240"
          subtitle="This month"
          icon={<Leaf className="w-5 h-5" />}
          color="orange"
          trend={{ value: 8, label: 'vs last month' }}
        />
        <StatCard
          title="Successful Pickups"
          value="94.2%"
          subtitle="Lifetime rate"
          icon={<CheckCircle className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Avg Response"
          value="6.4 min"
          subtitle="To match a donation"
          icon={<Clock className="w-5 h-5" />}
          color="purple"
          trend={{ value: -15, label: 'faster vs last month' }}
        />
      </div>

      {/* ── Donation Status Funnel ── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-semibold text-[hsl(220,15%,15%)]">Donation Lifecycle</h4>
          <Badge variant="info">Last 30 days</Badge>
        </div>
        <div className="space-y-3">
          {[
            { stage: 'Created',   count: 48, pct: 100, color: 'blue' as const },
            { stage: 'Matched',   count: 44, pct: 92,  color: 'green' as const },
            { stage: 'Collected', count: 41, pct: 85,  color: 'orange' as const },
            { stage: 'Delivered', count: 38, pct: 79,  color: 'green' as const },
          ].map(({ stage, count, pct, color }) => (
            <div key={stage} className="flex items-center gap-4">
              <span className="w-24 text-sm text-[hsl(220,10%,45%)] font-medium">{stage}</span>
              <ProgressBar value={pct} color={color} height="md" />
              <span className="w-8 text-sm font-bold text-[hsl(220,15%,20%)] text-right">{count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Active Donations Table ── */}
      <Card padding="none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(220,13%,92%)]">
          <h4 className="font-semibold text-[hsl(220,15%,15%)]">Recent Donations</h4>
          <Link to="/donor/donations">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(220,13%,93%)] text-[hsl(220,10%,52%)]">
                <th className="text-left font-medium py-3 px-6">Food Item</th>
                <th className="text-left font-medium py-3 px-4">Quantity</th>
                <th className="text-left font-medium py-3 px-4">Expires</th>
                <th className="text-left font-medium py-3 px-4">Status</th>
                <th className="text-left font-medium py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((d, i) => {
                const urgency = urgencyLabel(d.use_before)
                const status = STATUS_CONFIG[d.status] ?? { label: d.status, variant: 'default' as const }
                return (
                  <tr key={d.id} className={`border-b border-[hsl(220,13%,95%)] hover:bg-[hsl(220,13%,98%)] transition-colors ${i === recentDonations.length - 1 ? 'border-0' : ''}`}>
                    <td className="py-4 px-6">
                      <div className="font-medium text-[hsl(220,15%,15%)]">{d.title}</div>
                      <div className="text-xs text-[hsl(220,10%,55%)] mt-0.5">{(d.food_category || d.category || '').replace(/_/g, ' ')}</div>
                    </td>
                    <td className="py-4 px-4 text-[hsl(220,10%,35%)]">{d.quantity} {d.quantity_unit || d.unit}</td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-xs" style={{ color: urgency.color }}>
                        {urgency.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Link to={`/donor/donations/${d.id}`}>
                        <Button variant="ghost" size="sm">
                          {d.status === 'MATCHED' ? 'Track' : 'View'}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Recent Deliveries ── */}
      {deliveries.length > 0 && (
        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-xl font-bold text-[hsl(220,15%,15%)] mb-6">Recent Deliveries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliveries.map((del) => {
              const d = del.match?.donation
              const r = del.match?.recipient
              const isCompleted = del.status === 'DELIVERED'
              if (!d || !r) return null

              return (
                <Card key={del.id} className="p-5 flex flex-col hover:border-primary transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={isCompleted ? 'default' : 'success'} className="bg-[hsl(25,95%,95%)] text-[hsl(25,95%,53%)]">
                      {del.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-[hsl(220,15%,15%)] mb-2">{d.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{d.quantity} {d.quantity_unit} • {d.food_category.replace(/_/g, ' ')}</p>

                  <div className="text-sm text-gray-500 mb-4">
                    <p><strong>To:</strong> {r.organization_name}</p>
                  </div>

                  {isCompleted && (
                    <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        fullWidth
                        onClick={() => setRatingTarget({
                          deliveryId: del.id,
                          reviewedUserId: r.owner_id,
                          reviewedUserName: r.organization_name,
                          defaultCategory: 'FOOD_QUALITY'
                        })}
                      >
                        Rate Recipient
                      </Button>
                      {del.volunteer_id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          fullWidth
                          onClick={() => setRatingTarget({
                            deliveryId: del.id,
                            reviewedUserId: del.volunteer_id,
                            reviewedUserName: 'Volunteer',
                            defaultCategory: 'DELIVERY_EXPERIENCE'
                          })}
                        >
                          Rate Volunteer
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingTarget && profile && (
        <RatingModal
          isOpen={!!ratingTarget}
          onClose={() => setRatingTarget(null)}
          deliveryId={ratingTarget.deliveryId}
          reviewerId={profile.id}
          reviewedUserId={ratingTarget.reviewedUserId}
          reviewedUserName={ratingTarget.reviewedUserName}
          defaultCategory={ratingTarget.defaultCategory}
        />
      )}

      {/* ── Impact This Month ── */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="col-span-2">
          <h4 className="font-semibold text-[hsl(220,15%,15%)] mb-4">Monthly Impact Trend</h4>
          <div className="space-y-3">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => {
              const vals = [45, 62, 38, 78]
              return (
                <div key={week} className="flex items-center gap-4">
                  <span className="w-14 text-xs text-[hsl(220,10%,52%)]">{week}</span>
                  <ProgressBar value={vals[i]} color="green" height="sm" />
                  <span className="text-xs font-semibold text-[hsl(220,15%,25%)] w-16 text-right">
                    {Math.round(vals[i] * 3.2)} meals
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h4 className="font-semibold text-[hsl(220,15%,15%)]">Food Alert</h4>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(38,90%,95%)] border border-[hsl(38,80%,85%)]">
            <AlertCircle className="w-5 h-5 text-[hsl(38,80%,38%)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[hsl(38,80%,30%)]">1 donation expiring soon</p>
              <p className="text-xs text-[hsl(38,70%,40%)] mt-0.5">
                "Mixed Fruit Salad" expires in {urgencyLabel(MOCK_DONATIONS[2].use_before).label}
              </p>
            </div>
          </div>
          <div className="mt-auto">
            <TrendingUp className="w-5 h-5 text-[hsl(142,71%,28%)] mb-2" />
            <p className="text-2xl font-black text-[hsl(220,15%,15%)]">79%</p>
            <p className="text-xs text-[hsl(220,10%,52%)]">Lifetime fulfilment rate</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
