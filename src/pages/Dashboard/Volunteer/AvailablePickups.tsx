import React, { useEffect, useState } from 'react'
import { Package, MapPin, Navigation, Truck } from 'lucide-react'
import { Card, Badge, Button, EmptyState, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { deliveryService, type AvailableDelivery } from '@/services/deliveryService'
import DeliveryMap from '@/components/map/DeliveryMap'
import toast from 'react-hot-toast'

export default function AvailablePickups() {
  const { profile } = useAuthStore()
  const [deliveries, setDeliveries] = useState<AvailableDelivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      const data = await deliveryService.getAvailableDeliveries()
      setDeliveries(data)
    } catch (err: any) {
      toast.error('Failed to load pickups: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleClaim = async (matchId: string) => {
    if (!profile) return
    setClaimingId(matchId)
    try {
      await deliveryService.claimDelivery(matchId, profile.id)
      toast.success('🚀 Delivery claimed! Check My Deliveries.')
      await load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setClaimingId(null)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Pickups</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {deliveries.length > 0
              ? `${deliveries.length} rescue mission${deliveries.length !== 1 ? 's' : ''} waiting for a driver`
              : 'No pickups available right now'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <Navigation className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {deliveries.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-8 h-8 text-gray-400" />}
          title="No Pickups Available"
          description="All food in your area has been claimed! Check back soon — new donations are listed throughout the day."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {deliveries.map((d) => (
            <Card key={d.match_id} className="p-5 flex flex-col hover:border-[hsl(195,85%,60%)] transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <Badge variant="info" className="bg-[hsl(195,85%,92%)] text-[hsl(195,85%,30%)]">
                  🚨 Needs Driver
                </Badge>
                <span className="text-sm font-semibold text-gray-700">
                  {d.quantity} {d.quantity_unit}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{d.donation_title}</h3>
              <p className="text-xs text-gray-500 mb-4">{d.food_category.replace(/_/g, ' ')}</p>

              {/* Map */}
              <div className="mb-4 flex-1">
                <DeliveryMap
                  pickupLat={d.donor_lat}
                  pickupLng={d.donor_lng}
                  dropoffLat={d.recipient_lat}
                  dropoffLng={d.recipient_lng}
                  pickupLabel={d.donor_address}
                  dropoffLabel={d.recipient_address}
                />
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Pickup</p>
                  <p className="text-xs font-medium text-gray-800 line-clamp-2">{d.donor_address}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{d.donor_name}</p>
                </div>
                <div className="bg-[hsl(195,85%,96%)] p-2.5 rounded-xl">
                  <p className="text-[10px] font-bold text-[hsl(195,85%,35%)] uppercase tracking-wide mb-1">Drop-off</p>
                  <p className="text-xs font-medium text-gray-800 line-clamp-2">{d.recipient_address}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{d.recipient_name}</p>
                </div>
              </div>

              <Button
                className="w-full bg-[hsl(195,85%,41%)] hover:bg-[hsl(195,85%,33%)] shadow-lg shadow-[hsla(195,85%,41%,0.3)]"
                onClick={() => handleClaim(d.match_id)}
                isLoading={claimingId === d.match_id}
              >
                <Truck className="w-4 h-4 mr-2" />
                Claim this Pickup
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
