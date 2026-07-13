import {
  Shield, Package, Users, TrendingUp, AlertTriangle,
  CheckCircle, Clock, MapPin, ArrowRight, Eye
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard, Card, Badge, Button, ProgressBar } from '@/components/ui'

const VERIFICATION_QUEUE = [
  { id: '1', org: 'Asha Foundation',     type: 'NGO',      submitted: '2h ago',  docs: 3, urgency: 'high' },
  { id: '2', org: 'Kakinada Food Bank',  type: 'FOOD_BANK',submitted: '5h ago',  docs: 2, urgency: 'medium' },
  { id: '3', org: 'St. Mary\'s Shelter', type: 'SHELTER',  submitted: '1d ago',  docs: 4, urgency: 'low' },
]

const LIVE_DONATIONS = [
  { id: '1', title: 'Rice & Curry',    donor: 'Green Leaf', status: 'MATCHED',    time: '2m ago', risk: 'low' },
  { id: '2', title: 'Bread Packs',     donor: 'City Bakery', status: 'AVAILABLE', time: '8m ago', risk: 'medium' },
  { id: '3', title: 'Catered Meals',   donor: 'TCS Cafeteria', status: 'COLLECTED', time: '15m ago', risk: 'low' },
  { id: '4', title: 'Fruit Salad',     donor: 'Hotel Marina', status: 'AVAILABLE', time: '22m ago', risk: 'high' },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(220,15%,12%)]">Platform Operations 🛡️</h2>
          <p className="text-[hsl(220,10%,52%)] text-sm mt-1">
            Live overview — Kakinada Region · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Badge variant="success" dot className="text-sm">All systems operational</Badge>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Food Rescued"        value="142 T"   icon={<Package className="w-5 h-5" />}      color="green"  subtitle="Lifetime platform total" trend={{ value: 18, label: 'vs last month' }} />
        <StatCard title="Estimated Meals"     value="284K"    icon={<TrendingUp className="w-5 h-5" />}   color="orange" subtitle="Since launch" />
        <StatCard title="Active Donations"    value="23"      icon={<Clock className="w-5 h-5" />}        color="blue"   subtitle="Right now" />
        <StatCard title="Delivery Rate"       value="91.4%"   icon={<CheckCircle className="w-5 h-5" />}  color="purple" subtitle="Lifetime success" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Verification Queue ── */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-[hsl(220,15%,15%)]">Verification Queue</h4>
            <Badge variant="warning">{VERIFICATION_QUEUE.length} pending</Badge>
          </div>

          <div className="space-y-3">
            {VERIFICATION_QUEUE.map((item) => (
              <div key={item.id} className="flex items-start justify-between p-3 rounded-xl bg-[hsl(220,13%,97%)] border border-[hsl(220,13%,92%)] group">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.urgency === 'high' ? 'bg-red-400' : item.urgency === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-[hsl(220,15%,15%)]">{item.org}</p>
                    <p className="text-xs text-[hsl(220,10%,52%)]">{item.type} · {item.docs} docs · {item.submitted}</p>
                  </div>
                </div>
                <Link to={`/admin/verifications/${item.id}`}>
                  <Button variant="ghost" size="sm" id={`verify-btn-${item.id}`}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <Link to="/admin/verifications">
            <Button variant="outline" size="sm" fullWidth className="mt-4">
              View All Verifications
            </Button>
          </Link>
        </Card>

        {/* ── Live Operations ── */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-[hsl(220,15%,15%)]">Live Donation Feed</h4>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-[hsl(220,10%,52%)]">Live</span>
            </div>
          </div>

          <div className="space-y-2">
            {LIVE_DONATIONS.map((d) => {
              const riskColor = d.risk === 'high' ? 'text-red-500 bg-red-50' : d.risk === 'medium' ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'
              const statusVariant = d.status === 'DELIVERED' ? 'success' : d.status === 'MATCHED' ? 'purple' : 'info'
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[hsl(220,13%,97%)] transition-colors">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${riskColor}`}>
                    {d.risk.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[hsl(220,15%,15%)] truncate">{d.title}</span>
                    <span className="text-xs text-[hsl(220,10%,52%)] ml-2">by {d.donor}</span>
                  </div>
                  <Badge variant={statusVariant} className="shrink-0 text-[10px]">{d.status}</Badge>
                  <span className="text-xs text-[hsl(220,10%,60%)] shrink-0">{d.time}</span>
                </div>
              )
            })}
          </div>

          <Link to="/admin/donations">
            <Button variant="ghost" size="sm" fullWidth className="mt-4" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Donations
            </Button>
          </Link>
        </Card>
      </div>

      {/* ── Platform Health ── */}
      <Card>
        <h4 className="font-semibold text-[hsl(220,15%,15%)] mb-5">Platform Health Indicators</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Pickup Success Rate',     value: 91, color: 'green' as const },
            { label: 'Average Match Time',       value: 78, color: 'blue' as const },
            { label: 'Donor Retention',          value: 84, color: 'orange' as const },
            { label: 'Volunteer Availability',   value: 65, color: 'green' as const },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[hsl(220,10%,45%)]">{item.label}</span>
                <span className="text-sm font-bold text-[hsl(220,15%,15%)]">{item.value}%</span>
              </div>
              <ProgressBar value={item.value} color={item.color} height="sm" />
            </div>
          ))}
        </div>
      </Card>

      {/* ── Quick Actions ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Review Flagged Donations', icon: AlertTriangle, color: 'text-red-500 bg-red-50',    link: '/admin/reports',       count: 2 },
          { label: 'Pending User Verifications', icon: Shield, color: 'text-purple-600 bg-purple-50',   link: '/admin/verifications', count: 3 },
          { label: 'Coverage Gap Analysis',    icon: MapPin, color: 'text-blue-600 bg-blue-50',         link: '/admin/analytics',     count: null },
        ].map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.label} to={action.link}>
              <Card hover className="flex items-center gap-4 cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[hsl(220,15%,15%)]">{action.label}</p>
                </div>
                {action.count && (
                  <Badge variant="danger" className="shrink-0">{action.count}</Badge>
                )}
                <ArrowRight className="w-4 h-4 text-[hsl(220,10%,60%)] shrink-0" />
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
