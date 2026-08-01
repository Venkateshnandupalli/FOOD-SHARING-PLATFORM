import React, { useEffect, useState } from 'react'
import { MapPin, Building2, Package, Filter } from 'lucide-react'
import { Card, Badge, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
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

function makeIcon(color: string, size = 12) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const ORG_TYPE_COLORS: Record<string, string> = {
  NGO:                 '#16a34a',
  FOOD_BANK:           '#3b82f6',
  ORPHANAGE:           '#f59e0b',
  SHELTER:             '#8b5cf6',
  COMMUNITY_KITCHEN:   '#06b6d4',
  RELIEF_ORGANISATION: '#ec4899',
  OTHER:               '#6b7280',
}

const DONATION_COLOR = '#f97316'

type LayerFilter = 'ALL' | 'ORGS' | 'DONATIONS'

export default function GeographicDashboard() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [donations, setDonations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [layer, setLayer] = useState<LayerFilter>('ALL')
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>('ALL')

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const [{ data: orgData }, { data: donData }] = await Promise.all([
          (supabase as any)
            .from('organizations')
            .select('id, organization_name, organization_type, address, city, latitude, longitude, verification_status')
            .eq('verification_status', 'APPROVED')
            .not('latitude', 'is', null),
          (supabase as any)
            .from('donations')
            .select('id, title, food_category, quantity, quantity_unit, status, pickup_latitude, pickup_longitude, address')
            .in('status', ['AVAILABLE', 'MATCHED'])
            .not('pickup_latitude', 'is', null)
            .limit(100),
        ])
        setOrgs(orgData || [])
        setDonations(donData || [])
      } catch {
        // graceful
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filteredOrgs = orgs.filter(o =>
    (layer === 'ALL' || layer === 'ORGS') &&
    (orgTypeFilter === 'ALL' || o.organization_type === orgTypeFilter)
  )
  const filteredDonations = donations.filter(() => layer === 'ALL' || layer === 'DONATIONS')

  const center: [number, number] =
    orgs.length > 0 && orgs[0].latitude
      ? [orgs[0].latitude, orgs[0].longitude]
      : [20.5937, 78.9629] // India center

  const orgTypes = [...new Set(orgs.map(o => o.organization_type))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Geographic Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {filteredOrgs.length} organizations and {filteredDonations.length} active donations on the map.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Layer toggle */}
        <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
          {(['ALL', 'ORGS', 'DONATIONS'] as LayerFilter[]).map(l => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                layer === l ? 'bg-[hsl(210,80%,38%)] text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {l === 'ALL' ? 'Show All' : l === 'ORGS' ? '🏢 Organisations' : '📦 Donations'}
            </button>
          ))}
        </div>

        {/* Org type filter */}
        {(layer === 'ALL' || layer === 'ORGS') && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setOrgTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                orgTypeFilter === 'ALL'
                  ? 'bg-[hsl(210,80%,38%)] text-white border-transparent'
                  : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              All Types
            </button>
            {orgTypes.map(type => (
              <button
                key={type}
                onClick={() => setOrgTypeFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border flex items-center gap-1.5 ${
                  orgTypeFilter === type
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
                style={orgTypeFilter === type ? { background: ORG_TYPE_COLORS[type] ?? '#6b7280' } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: ORG_TYPE_COLORS[type] ?? '#6b7280' }} />
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries(ORG_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-gray-600 font-medium">{type.replace(/_/g, ' ')}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONATION_COLOR }} />
          <span className="text-gray-600 font-medium">Active Donation</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Map */}
          <div className="xl:col-span-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 560 }}>
            <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              />

              {/* Organization Markers */}
              {filteredOrgs.map(org => (
                <Marker
                  key={org.id}
                  position={[org.latitude, org.longitude]}
                  icon={makeIcon(ORG_TYPE_COLORS[org.organization_type] ?? '#6b7280', 14)}
                >
                  <Popup>
                    <strong>{org.organization_name}</strong><br />
                    <span className="text-xs text-gray-600">{org.organization_type.replace(/_/g, ' ')}</span><br />
                    <span className="text-xs text-gray-500">{org.city}</span>
                  </Popup>
                </Marker>
              ))}

              {/* Donation Markers */}
              {filteredDonations.map(don => (
                <React.Fragment key={don.id}>
                  <Marker
                    position={[don.pickup_latitude, don.pickup_longitude]}
                    icon={makeIcon(DONATION_COLOR, 10)}
                  >
                    <Popup>
                      <strong>{don.title}</strong><br />
                      <span className="text-xs text-gray-600">{don.quantity} {don.quantity_unit}</span><br />
                      <span className="text-xs text-gray-500">{don.food_category?.replace(/_/g, ' ')}</span>
                    </Popup>
                  </Marker>
                  {/* Privacy radius circle */}
                  <Circle
                    center={[don.pickup_latitude, don.pickup_longitude]}
                    radius={800}
                    pathOptions={{ color: DONATION_COLOR, fillColor: DONATION_COLOR, fillOpacity: 0.08, weight: 1 }}
                  />
                </React.Fragment>
              ))}
            </MapContainer>
          </div>

          {/* Sidebar summary */}
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 mb-3">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Organizations</span>
                  <span className="font-bold text-gray-900">{filteredOrgs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Donations</span>
                  <span className="font-bold text-orange-600">{filteredDonations.length}</span>
                </div>
              </div>
            </Card>

            {/* Org type breakdown */}
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">By Type</h3>
              <div className="space-y-2.5">
                {(Object.entries(
                  orgs.reduce((acc, o) => {
                    acc[o.organization_type] = (acc[o.organization_type] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                ) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: ORG_TYPE_COLORS[type] ?? '#6b7280' }} />
                      <span className="text-xs text-gray-600 font-medium">{type.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
