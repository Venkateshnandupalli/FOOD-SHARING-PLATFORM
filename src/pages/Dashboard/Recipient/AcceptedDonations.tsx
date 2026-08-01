import React, { useEffect, useState } from 'react'
import { Package, Truck, CheckCircle, Clock, User, MapPin } from 'lucide-react'
import { Card, Badge, EmptyState, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { organizationService } from '@/services/organizationService'
import { deliveryService } from '@/services/deliveryService'
import { RatingModal } from '@/components/RatingModal'
import { formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' | 'purple' | 'danger' }> = {
  ASSIGNED:          { label: 'Volunteer Assigned',   variant: 'info'    },
  EN_ROUTE_PICKUP:   { label: 'En Route to Pickup',   variant: 'warning' },
  COLLECTED:         { label: 'Food Collected',        variant: 'warning' },
  EN_ROUTE_DELIVERY: { label: 'En Route to You',      variant: 'purple'  },
  DELIVERED:         { label: 'Delivered ✓',          variant: 'success' },
  FAILED:            { label: 'Failed',               variant: 'danger'  },
  CANCELLED:         { label: 'Cancelled',            variant: 'danger'  },
}

export default function AcceptedDonations() {
  const { profile } = useAuthStore()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ratingTarget, setRatingTarget] = useState<{
    deliveryId: string
    reviewedUserId: string
    reviewedUserName: string
    defaultCategory: 'FOOD_QUALITY' | 'DELIVERY_EXPERIENCE'
  } | null>(null)

  useEffect(() => {
    async function load() {
      if (!profile) return
      setIsLoading(true)
      try {
        const org = await organizationService.getOrganizationByOwnerId(profile.id)
        if (!org) return
        const data = await deliveryService.getDeliveriesForRecipient(org.id)
        // Show all non-completed deliveries
        const active = (data || []).filter((d: any) => d.status !== 'DELIVERED' && d.status !== 'FAILED' && d.status !== 'CANCELLED')
        setDeliveries(active)
      } catch {
        // graceful
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [profile])

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
        <h1 className="text-2xl font-bold text-gray-900">Accepted Donations</h1>
        <p className="text-gray-500 mt-1 text-sm">Track donations you have accepted that are on their way.</p>
      </div>

      {deliveries.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-gray-400" />}
          title="No Accepted Donations In Progress"
          description="When you accept a donation and it's being prepared for delivery, it will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {deliveries.map((del) => {
            const donation = del.match?.donation
            const volunteer = del.volunteer
            if (!donation) return null
            const statusCfg = STATUS_CONFIG[del.status] ?? STATUS_CONFIG.ASSIGNED

            return (
              <Card key={del.id} className="p-5 space-y-4 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 leading-snug">{donation.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{donation.quantity} {donation.quantity_unit}</p>
                  </div>
                  <Badge variant={statusCfg.variant} className="ml-2 shrink-0">{statusCfg.label}</Badge>
                </div>

                {/* Food Category */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="w-4 h-4 text-[hsl(25,95%,53%)]" />
                  <span>{(donation.food_category || '').replace(/_/g, ' ')}</span>
                </div>

                {/* Volunteer info */}
                {volunteer ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Volunteer</p>
                      <p className="text-sm font-medium text-gray-900">{volunteer.full_name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-500">Awaiting volunteer assignment…</p>
                  </div>
                )}

                {/* Status visual */}
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    Last update: {formatDate(del.updated_at || del.created_at)}
                  </p>
                </div>
              </Card>
            )
          })}
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
