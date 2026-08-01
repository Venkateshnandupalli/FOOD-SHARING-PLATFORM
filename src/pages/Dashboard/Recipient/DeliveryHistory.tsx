import React, { useEffect, useState } from 'react'
import { Truck, Package, CheckCircle, Star } from 'lucide-react'
import { Card, Badge, EmptyState, Spinner, Button } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { organizationService } from '@/services/organizationService'
import { deliveryService } from '@/services/deliveryService'
import { RatingModal } from '@/components/RatingModal'
import { formatDate } from '@/lib/utils'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  DELIVERED: 'success',
  FAILED: 'danger',
  CANCELLED: 'danger',
}

export default function RecipientDeliveryHistory() {
  const { profile } = useAuthStore()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'DELIVERED' | 'FAILED'>('ALL')
  const [ratingTarget, setRatingTarget] = useState<{
    deliveryId: string
    reviewedUserId: string
    reviewedUserName: string
    defaultCategory: 'FOOD_QUALITY' | 'DELIVERY_EXPERIENCE'
  } | null>(null)

  const load = async () => {
    if (!profile) return
    setIsLoading(true)
    try {
      const org = await organizationService.getOrganizationByOwnerId(profile.id)
      if (!org) return
      const data = await deliveryService.getDeliveriesForRecipient(org.id)
      // Only completed/cancelled deliveries
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

  useEffect(() => { load() }, [profile])

  const filtered = filter === 'ALL' ? deliveries : deliveries.filter(d => d.status === filter)

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
          <h1 className="text-2xl font-bold text-gray-900">Delivery History</h1>
          <p className="text-gray-500 mt-1 text-sm">{deliveries.length} total completed deliveries</p>
        </div>
        {/* Filter Tabs */}
        <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
          {(['ALL', 'DELIVERED', 'FAILED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[hsl(142,71%,28%)] text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'DELIVERED' ? 'Completed' : 'Failed'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-8 h-8 text-gray-400" />}
          title="No History Found"
          description="Your completed and failed deliveries will appear here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Donation</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Quantity</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Volunteer</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Date</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((del) => {
                  const donation = del.match?.donation
                  const volunteer = del.volunteer
                  if (!donation) return null
                  const statusV = STATUS_VARIANT[del.status] ?? 'default'

                  return (
                    <tr key={del.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{donation.title}</p>
                        <p className="text-xs text-gray-400">{(donation.food_category || '').replace(/_/g, ' ')}</p>
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {donation.quantity} {donation.quantity_unit}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {volunteer?.full_name || <span className="text-gray-400 italic">Self-pickup</span>}
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(del.updated_at || del.created_at, 'dd MMM yyyy')}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={statusV}>{del.status.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-4 px-6">
                        {del.status === 'DELIVERED' && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRatingTarget({
                                deliveryId: del.id,
                                reviewedUserId: donation.donor_id,
                                reviewedUserName: 'Donor',
                                defaultCategory: 'FOOD_QUALITY'
                              })}
                            >
                              <Star className="w-3.5 h-3.5 mr-1" /> Rate
                            </Button>
                          </div>
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
    </div>
  )
}
