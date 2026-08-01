import React, { useEffect, useState } from 'react'
import { Truck, Package, CheckCircle, Clock } from 'lucide-react'
import { Card, Badge, EmptyState, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { deliveryService } from '@/services/deliveryService'
import { formatDate } from '@/lib/utils'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default' | 'purple'> = {
  ASSIGNED:          'info',
  EN_ROUTE_PICKUP:   'warning',
  COLLECTED:         'warning',
  EN_ROUTE_DELIVERY: 'purple',
  DELIVERED:         'success',
  FAILED:            'danger',
  CANCELLED:         'danger',
}

type FilterType = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'FAILED'

export default function AllAssignments() {
  const { profile } = useAuthStore()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('ALL')

  useEffect(() => {
    async function load() {
      if (!profile) return
      setIsLoading(true)
      try {
        const data = await deliveryService.getMyDeliveries(profile.id)
        setDeliveries(data || [])
      } catch {
        // graceful
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [profile])

  const ACTIVE_STATUSES = ['ASSIGNED', 'EN_ROUTE_PICKUP', 'COLLECTED', 'EN_ROUTE_DELIVERY']

  const filtered = deliveries.filter(d => {
    if (filter === 'ALL') return true
    if (filter === 'ACTIVE') return ACTIVE_STATUSES.includes(d.status)
    if (filter === 'DELIVERED') return d.status === 'DELIVERED'
    if (filter === 'FAILED') return ['FAILED', 'CANCELLED'].includes(d.status)
    return true
  })

  const counts = {
    ALL: deliveries.length,
    ACTIVE: deliveries.filter(d => ACTIVE_STATUSES.includes(d.status)).length,
    DELIVERED: deliveries.filter(d => d.status === 'DELIVERED').length,
    FAILED: deliveries.filter(d => ['FAILED', 'CANCELLED'].includes(d.status)).length,
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Assignments</h1>
          <p className="text-gray-500 mt-1 text-sm">Your full delivery history and active assignments.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'ACTIVE', 'DELIVERED', 'FAILED'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? 'bg-[hsl(195,85%,41%)] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Active' : f === 'DELIVERED' ? 'Completed' : 'Failed'}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold ${filter === f ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-8 h-8 text-gray-400" />}
          title="No Assignments Found"
          description="Assignments matching your filter will appear here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Donation</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Pickup → Dropoff</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Date</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((del) => {
                  const donation = del.match?.donation
                  const recipient = del.match?.recipient
                  if (!donation) return null

                  return (
                    <tr key={del.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{donation.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{donation.quantity} {donation.quantity_unit}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-xs text-gray-600 line-clamp-1">{donation.address || 'Pickup location'}</p>
                        <p className="text-xs text-[hsl(195,85%,41%)] line-clamp-1 mt-0.5">→ {recipient?.organization_name || recipient?.address || 'Recipient'}</p>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(del.created_at, 'dd MMM yyyy')}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={STATUS_VARIANT[del.status] ?? 'default'}>
                          {del.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
