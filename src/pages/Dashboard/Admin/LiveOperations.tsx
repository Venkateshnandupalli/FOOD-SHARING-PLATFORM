import React, { useEffect, useState } from 'react'
import { MapPin, Package, Truck, RefreshCw } from 'lucide-react'
import { Badge, Button, EmptyState, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

const STATUS_COLOR: Record<string, string> = {
  ASSIGNED:          '#3b82f6',
  EN_ROUTE_PICKUP:   '#f59e0b',
  COLLECTED:         '#8b5cf6',
  EN_ROUTE_DELIVERY: '#f97316',
  DELIVERED:         '#22c55e',
}

export default function LiveOperations() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          id, status, created_at, updated_at,
          match:matches!inner(
            id,
            donation:donations!inner(
              title, food_category, quantity, quantity_unit,
              pickup_latitude, pickup_longitude, address
            ),
            recipient:organizations!inner(
              organization_name, address, latitude, longitude
            )
          ),
          volunteer:profiles!volunteer_id(full_name, phone)
        `)
        .in('status', ['ASSIGNED', 'EN_ROUTE_PICKUP', 'COLLECTED', 'EN_ROUTE_DELIVERY'])
        .order('updated_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setDeliveries(data || [])
    } catch {
      // graceful
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const center: [number, number] = deliveries.length > 0 && deliveries[0].match?.donation?.pickup_latitude
    ? [deliveries[0].match.donation.pickup_latitude, deliveries[0].match.donation.pickup_longitude]
    : [16.9891, 82.2475]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Operations Map</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {deliveries.length} active deliver{deliveries.length !== 1 ? 'ies' : 'y'} in progress
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} isLoading={isLoading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs font-medium text-gray-600">{status.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-8 h-8 text-gray-400" />}
          title="No Active Deliveries"
          description="All deliveries are either completed or there are none in progress right now."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Map */}
          <div className="xl:col-span-2 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 520 }}>
            <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              />
              {deliveries.map((del) => {
                const donation = del.match?.donation
                const recipient = del.match?.recipient
                const color = STATUS_COLOR[del.status] ?? '#6b7280'
                if (!donation?.pickup_latitude) return null
                return (
                  <React.Fragment key={del.id}>
                    {/* Pickup marker */}
                    <Marker
                      position={[donation.pickup_latitude, donation.pickup_longitude]}
                      icon={makeIcon(color)}
                      eventHandlers={{ click: () => setSelected(del) }}
                    >
                      <Popup>
                        <strong>{donation.title}</strong><br />
                        Status: {del.status.replace(/_/g, ' ')}<br />
                        Volunteer: {del.volunteer?.full_name || 'N/A'}
                      </Popup>
                    </Marker>
                    {/* Recipient marker */}
                    {recipient?.latitude && (
                      <Marker
                        position={[recipient.latitude, recipient.longitude]}
                        icon={makeIcon('#22c55e')}
                      >
                        <Popup>
                          <strong>{recipient.organization_name}</strong><br />
                          {recipient.address}
                        </Popup>
                      </Marker>
                    )}
                  </React.Fragment>
                )
              })}
            </MapContainer>
          </div>

          {/* Sidebar list */}
          <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {deliveries.map((del) => {
              const donation = del.match?.donation
              const recipient = del.match?.recipient
              const color = STATUS_COLOR[del.status] ?? '#6b7280'
              return (
                <div
                  key={del.id}
                  onClick={() => setSelected(del)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selected?.id === del.id
                      ? 'border-[hsl(270,60%,38%)] bg-purple-50'
                      : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{donation?.title}</p>
                      <p className="text-xs text-gray-500">{recipient?.organization_name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="default" className="text-[10px]">{del.status.replace(/_/g, ' ')}</Badge>
                        <span className="text-[10px] text-gray-400">{del.volunteer?.full_name || 'No volunteer'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Detail Panel */}
      {selected && (() => {
        const donation = selected.match?.donation
        const recipient = selected.match?.recipient
        const volunteer = selected.volunteer
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">{donation?.title}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Status</p>
                <Badge variant="info">{selected.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Quantity</p>
                <p className="font-medium text-gray-800">{donation?.quantity} {donation?.quantity_unit}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Volunteer</p>
                <p className="font-medium text-gray-800">{volunteer?.full_name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Recipient</p>
                <p className="font-medium text-gray-800">{recipient?.organization_name}</p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
