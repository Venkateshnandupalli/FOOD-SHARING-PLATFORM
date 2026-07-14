import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom markers
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Fit bounds component
function FitBounds({ pickup, dropoff }: { pickup: [number, number], dropoff: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (pickup[0] && dropoff[0]) {
      const bounds = L.latLngBounds([pickup, dropoff])
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, pickup, dropoff])
  return null
}

interface DeliveryMapProps {
  pickupLat?: number | null
  pickupLng?: number | null
  dropoffLat?: number | null
  dropoffLng?: number | null
  pickupLabel?: string
  dropoffLabel?: string
}

export default function DeliveryMap({
  pickupLat, pickupLng, dropoffLat, dropoffLng, pickupLabel = 'Pickup', dropoffLabel = 'Drop-off'
}: DeliveryMapProps) {
  // Default center if coordinates are missing (e.g. Kakinada)
  const defaultCenter: [number, number] = [16.9891, 82.2475]
  
  const hasPickup = pickupLat != null && pickupLng != null
  const hasDropoff = dropoffLat != null && dropoffLng != null

  const pickupPos: [number, number] = hasPickup ? [pickupLat, pickupLng] : defaultCenter
  const dropoffPos: [number, number] = hasDropoff ? [dropoffLat, dropoffLng] : defaultCenter

  const showRoute = hasPickup && hasDropoff

  return (
    <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden border border-gray-200 relative z-0">
      <MapContainer 
        center={showRoute ? undefined : defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
        />
        
        {hasPickup && (
          <Marker position={pickupPos} icon={pickupIcon}>
            <Popup><strong>Pickup</strong><br/>{pickupLabel}</Popup>
          </Marker>
        )}
        
        {hasDropoff && (
          <Marker position={dropoffPos} icon={dropoffIcon}>
            <Popup><strong>Drop-off</strong><br/>{dropoffLabel}</Popup>
          </Marker>
        )}

        {showRoute && (
          <>
            <Polyline 
              positions={[pickupPos, dropoffPos]} 
              color="hsl(142,71%,28%)" 
              weight={4} 
              opacity={0.7} 
              dashArray="8, 8"
            />
            <FitBounds pickup={pickupPos} dropoff={dropoffPos} />
          </>
        )}
      </MapContainer>
    </div>
  )
}
