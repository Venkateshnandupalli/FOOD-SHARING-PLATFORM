import { Truck, MapPin, Clock, CheckCircle, Navigation, AlertTriangle, Star } from 'lucide-react'
import { StatCard, Card, Badge, Button } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { urgencyLabel } from '@/lib/utils'

const ASSIGNMENTS = [
  {
    id: '1',
    donation_title: 'Vegetarian Rice Meals',
    donor_name: 'GreenLeaf Restaurant',
    donor_address: '12 MG Road, Kakinada',
    recipient_name: 'Hope Community Centre',
    recipient_address: '45 Gandhi Nagar, Kakinada',
    distance_km: 5.8,
    pickup_window: '7:30 PM – 8:00 PM',
    use_before: new Date(Date.now() + 65 * 60 * 1000).toISOString(),
    status: 'EN_ROUTE_PICKUP',
    servings: 40,
  },
  {
    id: '2',
    donation_title: 'Bread & Pastries',
    donor_name: 'City Bakery',
    donor_address: '78 Beach Road, Kakinada',
    recipient_name: 'Nandini Shelter Home',
    recipient_address: '22 Subash Nagar, Kakinada',
    distance_km: 3.2,
    pickup_window: '9:00 PM – 9:30 PM',
    use_before: new Date(Date.now() + 165 * 60 * 1000).toISOString(),
    status: 'ASSIGNED',
    servings: 25,
  },
]

const STATUS_STEPS = ['ASSIGNED', 'EN_ROUTE_PICKUP', 'COLLECTED', 'EN_ROUTE_DELIVERY', 'DELIVERED']
const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Assignment Received',
  EN_ROUTE_PICKUP: 'Heading to Pickup',
  COLLECTED: 'Food Collected',
  EN_ROUTE_DELIVERY: 'Delivering',
  DELIVERED: 'Delivered ✓',
}

export default function VolunteerDashboard() {
  const { profile } = useAuthStore()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(220,15%,12%)]">
          Ready to deliver, {firstName}? 🚴
        </h2>
        <p className="text-[hsl(220,10%,52%)] text-sm mt-1">
          You have {ASSIGNMENTS.length} active assignments today.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Trips"    value="2"    icon={<Truck className="w-5 h-5" />}       color="green"  subtitle="1 active, 1 pending" />
        <StatCard title="Total Deliveries" value="87"   icon={<CheckCircle className="w-5 h-5" />}  color="blue"   trend={{ value: 5, label: 'this month' }} />
        <StatCard title="Avg Rating"       value="4.9 ★" icon={<Star className="w-5 h-5" />}        color="orange" subtitle="Based on 87 reviews" />
        <StatCard title="Distance Today"   value="9 km" icon={<MapPin className="w-5 h-5" />}       color="purple" />
      </div>

      {/* ── Assignments ── */}
      <div className="space-y-4">
        <h4 className="font-semibold text-[hsl(220,15%,15%)]">Today's Assignments</h4>

        {ASSIGNMENTS.map((a) => {
          const urgency = urgencyLabel(a.use_before)
          const stepIdx = STATUS_STEPS.indexOf(a.status)

          return (
            <Card key={a.id} className="overflow-hidden">
              {/* Status bar */}
              <div className="h-1.5 w-full bg-[hsl(220,13%,92%)] mb-4 -mt-6 -mx-6 relative overflow-hidden">
                <div
                  className="h-full bg-[hsl(195,85%,41%)] transition-all duration-500"
                  style={{ width: `${((stepIdx + 1) / STATUS_STEPS.length) * 100}%` }}
                />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-[hsl(220,15%,15%)]">{a.donation_title}</h4>
                    <Badge variant={a.status === 'EN_ROUTE_PICKUP' ? 'info' : 'default'} dot>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[hsl(142,60%,95%)]">
                      <div className="w-6 h-6 rounded-full bg-[hsl(142,71%,28%)] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[hsl(142,71%,25%)]">PICKUP FROM</p>
                        <p className="text-sm font-medium text-[hsl(220,15%,20%)]">{a.donor_name}</p>
                        <p className="text-xs text-[hsl(220,10%,52%)]">{a.donor_address}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[hsl(25,100%,95%)]">
                      <div className="w-6 h-6 rounded-full bg-[hsl(25,90%,44%)] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">D</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[hsl(25,80%,35%)]">DELIVER TO</p>
                        <p className="text-sm font-medium text-[hsl(220,15%,20%)]">{a.recipient_name}</p>
                        <p className="text-xs text-[hsl(220,10%,52%)]">{a.recipient_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-4 text-sm text-[hsl(220,10%,45%)]">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{a.distance_km} km total</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Pickup: {a.pickup_window}</span>
                    <span className="flex items-center gap-1.5" style={{ color: urgency.color }}>
                      <AlertTriangle className="w-4 h-4" />Expires: {urgency.label}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Navigation className="w-4 h-4" />}
                    id={`navigate-btn-${a.id}`}
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a.donor_address)}`)}
                  >
                    Navigate
                  </Button>
                  {a.status === 'EN_ROUTE_PICKUP' && (
                    <Button variant="outline" size="sm" id={`confirm-pickup-btn-${a.id}`}>
                      Confirm Pickup
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" id={`report-btn-${a.id}`}>
                    Report Issue
                  </Button>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="mt-5 flex items-center gap-0">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`flex flex-col items-center gap-1 flex-1 ${i < STATUS_STEPS.length - 1 ? '' : ''}`}>
                      <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        i <= stepIdx ? 'bg-[hsl(195,85%,41%)]' : 'bg-[hsl(220,13%,85%)]'
                      }`} />
                      <span className="text-[9px] text-[hsl(220,10%,55%)] text-center leading-tight hidden sm:block">
                        {STATUS_LABELS[step]?.split(' ')[0]}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 -mt-3.5 transition-all duration-300 ${
                        i < stepIdx ? 'bg-[hsl(195,85%,41%)]' : 'bg-[hsl(220,13%,88%)]'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── My Impact ── */}
      <Card>
        <h4 className="font-semibold text-[hsl(220,15%,15%)] mb-4">Your Volunteer Impact</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Deliveries',     value: '87',      icon: '📦' },
            { label: 'Meals Enabled',  value: '3,480',   icon: '🍽️' },
            { label: 'Distance',       value: '412 km',  icon: '🛣️' },
            { label: 'Food Rescued',   value: '1.2 T',   icon: '♻️' },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 rounded-xl bg-[hsl(220,13%,97%)]">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-black text-xl text-[hsl(220,15%,15%)]">{item.value}</div>
              <div className="text-xs text-[hsl(220,10%,52%)] mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
