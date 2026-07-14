import React, { useEffect, useState } from 'react'
import { Truck, MapPin, CheckCircle, Navigation, Package, ArrowRight } from 'lucide-react'
import { Card, Badge, Button, EmptyState, Spinner, Input } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { deliveryService } from '@/services/deliveryService'
import type { AvailableDelivery } from '@/services/deliveryService'
import DeliveryMap from '@/components/map/DeliveryMap'
import toast from 'react-hot-toast'

export default function VolunteerDashboard() {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'MY_DELIVERIES'>('AVAILABLE')
  
  const [availableDeliveries, setAvailableDeliveries] = useState<AvailableDelivery[]>([])
  const [myDeliveries, setMyDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<{ [key: string]: File }>({})

  const loadData = async () => {
    if (!profile) return
    setIsLoading(true)
    try {
      if (activeTab === 'AVAILABLE') {
        const data = await deliveryService.getAvailableDeliveries()
        setAvailableDeliveries(data)
      } else {
        const data = await deliveryService.getMyDeliveries(profile.id)
        setMyDeliveries(data || [])
      }
    } catch (err: any) {
      toast.error('Failed to load data: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab, profile])

  const handleClaim = async (matchId: string) => {
    if (!profile) return
    setClaimingId(matchId)
    try {
      await deliveryService.claimDelivery(matchId, profile.id)
      toast.success('Delivery claimed successfully!')
      setActiveTab('MY_DELIVERIES')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setClaimingId(null)
    }
  }

  const handleUpdateStatus = async (deliveryId: string, currentStatus: string) => {
    setUpdatingId(deliveryId)
    let nextStatus: any = 'EN_ROUTE_PICKUP'
    if (currentStatus === 'ASSIGNED') nextStatus = 'EN_ROUTE_PICKUP'
    else if (currentStatus === 'EN_ROUTE_PICKUP') nextStatus = 'COLLECTED'
    else if (currentStatus === 'COLLECTED') nextStatus = 'EN_ROUTE_DELIVERY'
    else if (currentStatus === 'EN_ROUTE_DELIVERY') nextStatus = 'DELIVERED'

    try {
      let proofUrl = undefined
      if (nextStatus === 'DELIVERED') {
        const file = proofFile[deliveryId]
        if (!file) {
          toast.error('Please upload a proof of delivery photo.')
          setUpdatingId(null)
          return
        }
        proofUrl = await deliveryService.uploadDeliveryProof(file, deliveryId)
      }

      await deliveryService.updateStatus(deliveryId, nextStatus, proofUrl)
      toast.success('Status updated to ' + nextStatus)
      await loadData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (isLoading && availableDeliveries.length === 0 && myDeliveries.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Hub</h1>
          <p className="text-gray-500 mt-1">Deliver food, deliver hope.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'AVAILABLE' 
              ? 'border-b-2 border-[hsl(142,71%,28%)] text-[hsl(142,71%,28%)]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('AVAILABLE')}
        >
          Available Deliveries
        </button>
        <button
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'MY_DELIVERIES' 
              ? 'border-b-2 border-[hsl(142,71%,28%)] text-[hsl(142,71%,28%)]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('MY_DELIVERIES')}
        >
          My Deliveries
        </button>
      </div>

      {/* Available Deliveries Tab */}
      {activeTab === 'AVAILABLE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableDeliveries.length === 0 ? (
            <div className="col-span-full">
              <EmptyState 
                icon={<Truck className="w-8 h-8 text-gray-400" />}
                title="No deliveries available right now"
                description="Check back later! Matches happen constantly throughout the day."
              />
            </div>
          ) : (
            availableDeliveries.map(d => (
              <Card key={d.match_id} className="p-5 flex flex-col hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="success" className="bg-[hsl(142,60%,94%)] text-[hsl(142,71%,28%)]">
                    Needs Driver
                  </Badge>
                  <span className="text-sm font-medium text-gray-700">
                    {d.quantity} {d.quantity_unit}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-4">{d.donation_title}</h3>

                <div className="space-y-4 mb-6 flex-1">
                  <DeliveryMap
                    pickupLat={d.donor_lat}
                    pickupLng={d.donor_lng}
                    dropoffLat={d.recipient_lat}
                    dropoffLng={d.recipient_lng}
                    pickupLabel={d.donor_address}
                    dropoffLabel={d.recipient_address}
                  />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pickup From</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{d.donor_address}</p>
                      <p className="text-xs text-gray-500">{d.donor_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[hsl(142,71%,28%)] uppercase tracking-wide">Deliver To</p>
                      <p className="text-sm text-gray-900 line-clamp-2">{d.recipient_address}</p>
                      <p className="text-xs text-gray-500">{d.recipient_name}</p>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => handleClaim(d.match_id)}
                  isLoading={claimingId === d.match_id}
                >
                  Claim Delivery
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* My Deliveries Tab */}
      {activeTab === 'MY_DELIVERIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myDeliveries.length === 0 ? (
            <div className="col-span-full">
              <EmptyState 
                icon={<Package className="w-8 h-8 text-gray-400" />}
                title="You have no active deliveries"
                description="Go to the Available tab to claim a delivery!"
              />
            </div>
          ) : (
            myDeliveries.map(del => {
              const d = del.match.donation
              const r = del.match.recipient
              
              const isCompleted = del.status === 'DELIVERED'
              
              return (
                <Card key={del.id} className={`p-5 flex flex-col ${isCompleted ? 'opacity-70 bg-gray-50' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={isCompleted ? 'default' : 'success'} className="bg-[hsl(142,60%,94%)] text-[hsl(142,71%,28%)]">
                      {del.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-4">{d.title}</h3>
  
                  <div className="space-y-4 mb-6 flex-1">
                    <DeliveryMap
                      pickupLat={d.pickup_latitude}
                      pickupLng={d.pickup_longitude}
                      dropoffLat={r.location?.coordinates?.[1] || 16.9891} // Assuming location is GeoJSON Point [lng, lat]
                      dropoffLng={r.location?.coordinates?.[0] || 82.2475}
                      pickupLabel={d.address || d.pickup_address}
                      dropoffLabel={r.address}
                    />

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pickup From</p>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{d.address || d.pickup_address}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[hsl(142,71%,28%)] uppercase tracking-wide">Deliver To</p>
                        <p className="text-sm text-gray-900 line-clamp-2">{r.address}</p>
                        <p className="text-xs text-gray-500">{r.organization_name}</p>
                      </div>
                    </div>
                  </div>
  
                  {!isCompleted && (
                    <div className="space-y-4">
                      {del.status === 'EN_ROUTE_DELIVERY' && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Proof of Delivery</p>
                          <input 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[hsl(142,60%,94%)] file:text-[hsl(142,71%,28%)] hover:file:bg-[hsl(142,60%,90%)]"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setProofFile(prev => ({ ...prev, [del.id]: e.target.files![0] }))
                              }
                            }}
                          />
                        </div>
                      )}
                      <Button 
                        className="w-full" 
                        onClick={() => handleUpdateStatus(del.id, del.status)}
                        isLoading={updatingId === del.id}
                      >
                        {del.status === 'ASSIGNED' && 'Start Pickup Route'}
                        {del.status === 'EN_ROUTE_PICKUP' && 'Mark as Collected'}
                        {del.status === 'COLLECTED' && 'Start Delivery Route'}
                        {del.status === 'EN_ROUTE_DELIVERY' && 'Complete Delivery'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center justify-center text-[hsl(142,71%,28%)] font-medium gap-2 py-2">
                      <CheckCircle className="w-5 h-5" /> Delivery Completed
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
