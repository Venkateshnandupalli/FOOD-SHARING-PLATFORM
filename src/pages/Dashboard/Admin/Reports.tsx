import React, { useEffect, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Clock, Package, Truck, XCircle,
  RefreshCw, Flag
} from 'lucide-react'
import { Card, Badge, Button, EmptyState, Spinner, StatCard } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type IncidentType = 'EXPIRED_DONATION' | 'FAILED_DELIVERY' | 'CANCELLED_DONATION' | 'FLAGGED_MATCH'

interface Incident {
  id: string
  type: IncidentType
  title: string
  detail: string
  created_at: string
  resolved: boolean
}

const TYPE_CONFIG: Record<IncidentType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  EXPIRED_DONATION:   { label: 'Expired Donation',   icon: Package,       color: 'text-red-600',    bg: 'bg-red-50'    },
  FAILED_DELIVERY:    { label: 'Failed Delivery',     icon: Truck,         color: 'text-orange-600', bg: 'bg-orange-50' },
  CANCELLED_DONATION: { label: 'Cancelled Donation',  icon: XCircle,       color: 'text-gray-600',   bg: 'bg-gray-100'  },
  FLAGGED_MATCH:      { label: 'Flagged Match',        icon: Flag,          color: 'text-purple-600', bg: 'bg-purple-50' },
}

export default function Reports() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL')
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      // Aggregate incidents from expired donations + failed deliveries
      const [{ data: expired }, { data: failed }, { data: cancelled }] = await Promise.all([
        (supabase as any)
          .from('donations')
          .select('id, title, created_at')
          .eq('status', 'EXPIRED')
          .order('created_at', { ascending: false })
          .limit(40),
        (supabase as any)
          .from('deliveries')
          .select('id, created_at, match:matches(donation:donations(title))')
          .eq('status', 'FAILED')
          .order('created_at', { ascending: false })
          .limit(40),
        (supabase as any)
          .from('donations')
          .select('id, title, created_at')
          .eq('status', 'CANCELLED')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      const all: Incident[] = [
        ...((expired as any[]) || []).map((d: any) => ({
          id: `exp-${d.id}`,
          type: 'EXPIRED_DONATION' as IncidentType,
          title: `Donation expired: ${d.title}`,
          detail: 'This donation expired without being delivered. Food was wasted.',
          created_at: d.created_at,
          resolved: false,
        })),
        ...((failed as any[]) || []).map((d: any) => ({
          id: `fail-${d.id}`,
          type: 'FAILED_DELIVERY' as IncidentType,
          title: `Failed delivery: ${d.match?.donation?.title || 'Unknown'}`,
          detail: 'A delivery was attempted but failed. Needs review.',
          created_at: d.created_at,
          resolved: false,
        })),
        ...((cancelled as any[]) || []).map((d: any) => ({
          id: `can-${d.id}`,
          type: 'CANCELLED_DONATION' as IncidentType,
          title: `Donation cancelled: ${d.title}`,
          detail: 'Donor cancelled this donation before it could be matched.',
          created_at: d.created_at,
          resolved: false,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setIncidents(all)
    } catch (err: any) {
      toast.error('Failed to load reports: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleResolve = (id: string) => {
    setResolvingId(id)
    setTimeout(() => {
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, resolved: true } : i))
      setResolvingId(null)
      toast.success('Incident marked as resolved')
    }, 500)
  }

  const filtered = incidents.filter(i => {
    if (filter === 'OPEN') return !i.resolved
    if (filter === 'RESOLVED') return i.resolved
    return true
  })

  const openCount = incidents.filter(i => !i.resolved).length
  const resolvedCount = incidents.filter(i => i.resolved).length
  const expiredCount = incidents.filter(i => i.type === 'EXPIRED_DONATION').length
  const failedCount = incidents.filter(i => i.type === 'FAILED_DELIVERY').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Incidents</h1>
          <p className="text-gray-500 mt-1 text-sm">Platform issues requiring attention or review.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} isLoading={isLoading}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Open Incidents" value={openCount} icon={<AlertTriangle className="w-5 h-5" />} color="orange" />
        <StatCard title="Resolved" value={resolvedCount} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
        <StatCard title="Expired Donations" value={expiredCount} icon={<Package className="w-5 h-5" />} color="purple" />
        <StatCard title="Failed Deliveries" value={failedCount} icon={<Truck className="w-5 h-5" />} color="blue" />
      </div>

      {/* Filter Tabs */}
      <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white w-fit">
        {(['ALL', 'OPEN', 'RESOLVED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              filter === f ? 'bg-[hsl(270,60%,38%)] text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-gray-400" />}
          title="No Incidents Found"
          description="All clear — no incidents match this filter."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((incident) => {
            const cfg = TYPE_CONFIG[incident.type]
            const Icon = cfg.icon
            return (
              <div
                key={incident.id}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  incident.resolved
                    ? 'bg-gray-50 border-gray-100 opacity-60'
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{incident.title}</p>
                    {incident.resolved && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Resolved</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{incident.detail}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default" className="text-[10px]">{cfg.label}</Badge>
                    <span className="text-xs text-gray-400">{formatDate(incident.created_at, 'dd MMM yyyy, HH:mm')}</span>
                  </div>
                </div>

                {/* Action */}
                {!incident.resolved && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleResolve(incident.id)}
                    isLoading={resolvingId === incident.id}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
