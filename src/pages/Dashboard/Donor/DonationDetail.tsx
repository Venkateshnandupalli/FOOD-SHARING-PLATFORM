import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Package, Clock, MapPin, AlertCircle, Info, 
  Trash2, XCircle, CheckCircle, Navigation 
} from 'lucide-react'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { donationService } from '@/services/donationService'
import type { Database } from '@/types/database'
import { urgencyLabel } from '@/lib/utils'

type Donation = Database['public']['Tables']['donations']['Row']
type DonationImage = Database['public']['Tables']['donation_images']['Row']

export default function DonationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  
  const [donation, setDonation] = useState<Donation | null>(null)
  const [images, setImages] = useState<DonationImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')) {
          // Mock data
          setDonation({
            id: id,
            title: 'Mock Donation Details',
            description: 'This is a mock description because Supabase is not connected yet.',
            quantity: 50,
            quantity_unit: 'servings',
            status: 'AVAILABLE',
            food_category: 'COOKED_MEALS',
            dietary_type: 'MIXED',
            use_before: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
            prepared_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            pickup_address: '123 Fake Street, Kakinada',
            storage_type: 'ROOM_TEMPERATURE',
            packaging_status: 'SEALED'
          } as any)
          setIsLoading(false)
          return
        }

        const data = await donationService.getDonationById(id)
        setDonation(data.donation)
        setImages(data.images)
      } catch (err: any) {
        setError('Donation not found or access denied.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  const handleCancel = async () => {
    if (!donation || !window.confirm('Are you sure you want to cancel this donation?')) return
    setIsCancelling(true)
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')) {
        setDonation(prev => prev ? { ...prev, status: 'CANCELLED' } : null)
      } else {
        await donationService.cancelDonation(donation.id)
        setDonation(prev => prev ? { ...prev, status: 'CANCELLED' } : null)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to cancel donation.')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-20"><Spinner size="lg" /></div>
  }

  if (error || !donation) {
    return (
      <div className="text-center p-10">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Error</h3>
        <p className="text-[hsl(220,10%,52%)]">{error}</p>
        <Link to="/donor/donations">
          <Button variant="outline" className="mt-4">Go Back</Button>
        </Link>
      </div>
    )
  }

  const isExpired = new Date(donation.use_before).getTime() < Date.now()
  const isActive = donation.status === 'AVAILABLE' || donation.status === 'MATCHED'
  const primaryImage = images.find(img => img.is_primary) || images[0]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="px-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-[hsl(220,15%,12%)]">{donation.title}</h2>
            <Badge variant={donation.status === 'CANCELLED' || donation.status === 'EXPIRED' ? 'danger' : 'info'}>
              {donation.status}
            </Badge>
          </div>
          <p className="text-[hsl(220,10%,52%)] text-sm">ID: {donation.id}</p>
        </div>
        {isActive && (
          <Button 
            variant="ghost" 
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleCancel}
            isLoading={isCancelling}
          >
            Cancel Donation
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card padding="none" className="overflow-hidden">
            {primaryImage ? (
              <img src={primaryImage.image_url} alt={donation.title} className="w-full h-64 object-cover" />
            ) : (
              <div className="w-full h-32 bg-[hsl(220,13%,95%)] flex items-center justify-center">
                <Package className="w-8 h-8 text-[hsl(220,10%,80%)]" />
              </div>
            )}
            
            <div className="p-6">
              <h3 className="text-lg font-bold text-[hsl(220,15%,15%)] mb-4">Donation Details</h3>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-[hsl(220,10%,52%)] uppercase mb-1">Quantity</p>
                  <p className="text-sm font-medium text-[hsl(220,15%,20%)]">{donation.quantity} {donation.quantity_unit}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[hsl(220,10%,52%)] uppercase mb-1">Category</p>
                  <p className="text-sm font-medium text-[hsl(220,15%,20%)]">{donation.food_category.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[hsl(220,10%,52%)] uppercase mb-1">Dietary</p>
                  <p className="text-sm font-medium text-[hsl(220,15%,20%)]">{donation.dietary_type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[hsl(220,10%,52%)] uppercase mb-1">Storage</p>
                  <p className="text-sm font-medium text-[hsl(220,15%,20%)]">{donation.storage_type.replace(/_/g, ' ')}</p>
                </div>
              </div>

              {donation.description && (
                <div className="mt-6 pt-6 border-t border-[hsl(220,13%,91%)]">
                  <p className="text-xs font-semibold text-[hsl(220,10%,52%)] uppercase mb-2">Description</p>
                  <p className="text-sm text-[hsl(220,15%,35%)] leading-relaxed">{donation.description}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-[hsl(40,20%,97%)] border border-[hsl(220,13%,90%)]">
            <h4 className="font-bold text-[hsl(220,15%,15%)] mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[hsl(220,10%,52%)]" /> Timeline
            </h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[hsl(220,10%,52%)] mb-0.5">Prepared At</p>
                <p className="text-sm font-medium text-[hsl(220,15%,20%)]">
                  {new Date(donation.prepared_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[hsl(220,10%,52%)] mb-0.5">Expires At</p>
                <p className={`text-sm font-bold ${isExpired ? 'text-red-500' : 'text-[hsl(220,15%,20%)]'}`}>
                  {new Date(donation.use_before).toLocaleString()}
                </p>
                {!isExpired && (
                  <p className="text-xs mt-1" style={{ color: urgencyLabel(donation.use_before).color }}>
                    {urgencyLabel(donation.use_before).label}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h4 className="font-bold text-[hsl(220,15%,15%)] mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[hsl(220,10%,52%)]" /> Pickup Location
            </h4>
            <p className="text-sm text-[hsl(220,15%,35%)] leading-relaxed mb-4">
              {donation.pickup_address}
            </p>
            {donation.pickup_latitude && (
              <Button 
                variant="secondary" 
                size="sm" 
                fullWidth 
                leftIcon={<Navigation className="w-4 h-4" />}
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${donation.pickup_latitude},${donation.pickup_longitude}`)}
              >
                View on Map
              </Button>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
