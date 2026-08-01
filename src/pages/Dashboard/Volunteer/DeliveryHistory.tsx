import React, { useEffect, useState } from 'react'
import { Truck, CheckCircle, XCircle } from 'lucide-react'
import { Badge, EmptyState, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { deliveryService } from '@/services/deliveryService'
import { formatDate } from '@/lib/utils'

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'default'> = {
  DELIVERED: 'success',
  FAILED: 'danger',
  CANCELLED: 'danger',
}

export default function VolunteerDeliveryHistory() {
  const { profile } = useAuthStore()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile) return
      setIsLoading(true)
      try {
        const data = await deliveryService.getMyDeliveries(profile.id)
        const history = (data || []).filter((d: any) =>
          ['DELIVERED', 'FAILED', 'CANCELLED'].includes(d.status)
        )
        setDeliveries(history)
      } catch {
        // graceful
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [profile])

  const completed = deliveries.filter(d => d.status === 'DELIVERED').length

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Delivery History</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {completed} successful deliver{completed !== 1 ? 'ies' : 'y'} completed.
        </p>
      </div>

      {deliveries.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-8 h-8 text-gray-400" />}
          title="No History Yet"
          description="Once you complete deliveries, they'll appear here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Donation</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Recipient</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Completed</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deliveries.map((del) => {
                  const donation = del.match?.donation
                  const recipient = del.match?.recipient
                  if (!donation) return null
                  const statusV = STATUS_VARIANT[del.status] ?? 'default'

                  return (
                    <tr key={del.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{donation.title}</p>
                        <p className="text-xs text-gray-400">{donation.quantity} {donation.quantity_unit}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-700">{recipient?.organization_name || 'Recipient'}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{recipient?.city}</p>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(del.updated_at || del.created_at, 'dd MMM yyyy')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          {del.status === 'DELIVERED'
                            ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                            : <XCircle className="w-4 h-4 text-red-500" />
                          }
                          <Badge variant={statusV}>{del.status.replace(/_/g, ' ')}</Badge>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {del.proof_photo_url ? (
                          <a
                            href={del.proof_photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[hsl(195,85%,41%)] hover:underline"
                          >
                            View Photo
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
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
