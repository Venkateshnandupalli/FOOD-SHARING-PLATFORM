import React, { useEffect, useState } from 'react'
import { MapPin, Package, Truck, CheckCircle, Clock, User, ArrowRight } from 'lucide-react'
import { Card, Badge, EmptyState, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { deliveryService } from '@/services/deliveryService'
import DeliveryMap from '@/components/map/DeliveryMap'
import { formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' | 'purple' | 'danger'; step: number }> = {
  ASSIGNED:          { label: 'Volunteer Assigned',   variant: 'info',    step: 1 },
  EN_ROUTE_PICKUP:   { label: 'En Route to Pickup',   variant: 'warning', step: 2 },
  COLLECTED:         { label: 'Food Collected',        variant: 'warning', step: 3 },
  EN_ROUTE_DELIVERY: { label: 'En Route to Delivery', variant: 'purple',  step: 4 },
  DELIVERED:         { label: 'Delivered ✓',          variant: 'success', step: 5 },
  FAILED:            { label: 'Failed',               variant: 'danger',  step: 0 },
  CANCELLED:         { label: 'Cancelled',            variant: 'danger',  step: 0 },
}

const STEPS = ['Assigned', 'En Route Pickup', 'Collected', 'En Route Delivery', 'Delivered']

export default function PickupTracking() {
  const { profile } = useAuthStore()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile) return
      setIsLoading(true)
      try {
        const data = await deliveryService.getDeliveriesForDonor(profile.id)
        // Only show active (non-completed, non-cancelled) deliveries on this page
        const active = (data || []).filter(
          (d: any) => !['DELIVERED', 'FAILED', 'CANCELLED'].includes(d.status)
        )
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
        <h1 className="text-2xl font-bold text-gray-900">Pickup Tracking</h1>
        <p className="text-gray-500 mt-1 text-sm">Track your active food pickups in real-time.</p>
      </div>

      {deliveries.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-8 h-8 text-gray-400" />}
          title="No Active Pickups"
          description="When one of your donations is being picked up by a volunteer, it will appear here for tracking."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {deliveries.map((del) => {
            const donation = del.match?.donation
            const recipient = del.match?.recipient
            const volunteer = del.volunteer
            if (!donation) return null

            const statusCfg = STATUS_CONFIG[del.status] ?? STATUS_CONFIG.ASSIGNED
            const currentStep = statusCfg.step

            return (
              <Card key={del.id} className="p-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{donation.title}</h3>
                    <p className="text-sm text-gray-500">{donation.quantity} {donation.quantity_unit}</p>
                  </div>
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-1">
                  {STEPS.map((step, i) => {
                    const stepNum = i + 1
                    const isCompleted = currentStep > stepNum
                    const isActive = currentStep === stepNum
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? 'bg-[hsl(142,71%,28%)] text-white'
                              : isActive
                              ? 'bg-[hsl(38,90%,50%)] text-white ring-4 ring-[hsl(38,90%,85%)]'
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNum}
                          </div>
                          <span className={`text-[9px] mt-1 text-center font-medium leading-tight ${isActive ? 'text-[hsl(38,80%,38%)]' : isCompleted ? 'text-[hsl(142,71%,28%)]' : 'text-gray-400'}`}>
                            {step}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mb-4 transition-all ${currentStep > i + 1 ? 'bg-[hsl(142,71%,28%)]' : 'bg-gray-200'}`} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>

                {/* Map */}
                {donation.pickup_latitude && recipient?.latitude && (
                  <DeliveryMap
                    pickupLat={donation.pickup_latitude}
                    pickupLng={donation.pickup_longitude}
                    dropoffLat={recipient.latitude}
                    dropoffLng={recipient.longitude}
                    pickupLabel={donation.address || 'Pickup Point'}
                    dropoffLabel={recipient.address || 'Drop-off Point'}
                  />
                )}

                {/* Route Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pickup From</p>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{donation.address || 'Your location'}</p>
                  </div>
                  <div className="bg-[hsl(142,60%,97%)] rounded-xl p-3">
                    <p className="text-xs font-semibold text-[hsl(142,71%,28%)] uppercase tracking-wide mb-1">Deliver To</p>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{recipient?.organization_name || 'Recipient'}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{recipient?.address}</p>
                  </div>
                </div>

                {/* Volunteer Info */}
                {volunteer && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Volunteer</p>
                      <p className="text-sm font-medium text-gray-900">{volunteer.full_name}</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400">Last updated: {formatDate(del.updated_at || del.created_at)}</p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
