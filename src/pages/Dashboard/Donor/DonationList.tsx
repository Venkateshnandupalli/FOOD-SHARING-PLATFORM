import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Package, ArrowRight, Clock, MapPin, Eye, Edit2, AlertTriangle, AlertCircle } from 'lucide-react'
import { Button, Card, Badge, Spinner, EmptyState } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { donationService } from '@/services/donationService'
import type { Database } from '@/types/database'
import { urgencyLabel } from '@/lib/utils'

type Donation = Database['public']['Tables']['donations']['Row']

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' | 'purple' }> = {
  DRAFT:          { label: 'Draft',         variant: 'default' },
  AVAILABLE:      { label: 'Available',     variant: 'info' },
  MATCHED:        { label: 'Matched',       variant: 'purple' },
  ACCEPTED:       { label: 'Accepted',      variant: 'success' },
  PICKUP_ASSIGNED:{ label: 'Pickup Soon',   variant: 'warning' },
  COLLECTED:      { label: 'Collected',     variant: 'warning' },
  DELIVERED:      { label: 'Delivered ✓',   variant: 'success' },
  EXPIRED:        { label: 'Expired',       variant: 'danger' },
  CANCELLED:      { label: 'Cancelled',     variant: 'danger' },
}

export default function DonationList() {
  const { profile } = useAuthStore()
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!profile) return
      try {
        const data = await donationService.getDonorDonations(profile.id)
        setDonations(data)
      } catch (err: any) {
        console.error(err)
        setError('Failed to load donations. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [profile])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner size="lg" color="primary" />
        <p className="text-sm text-[hsl(220,10%,52%)] mt-4">Loading your donations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700 font-medium">{error}</p>
      </div>
    )
  }

  if (donations.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-8 h-8 text-[hsl(220,10%,60%)]" />}
        title="No donations yet"
        description="You haven't listed any surplus food yet. Create your first donation to start making an impact!"
        action={
          <Link to="/donor/create">
            <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Donation
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(220,15%,12%)]">My Donations</h2>
          <p className="text-[hsl(220,10%,52%)] text-sm mt-1">Manage your active and past food listings.</p>
        </div>
        <Link to="/donor/create">
          <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create Donation
          </Button>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {donations.map(donation => {
          const status = STATUS_CONFIG[donation.status] || { label: donation.status, variant: 'default' }
          const urgency = urgencyLabel(donation.use_before)
          const isExpired = new Date(donation.use_before).getTime() < Date.now()

          return (
            <Card key={donation.id} hover className="flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <Badge variant={status.variant}>{status.label}</Badge>
                {donation.food_category && (
                  <span className="text-[10px] uppercase font-bold text-[hsl(220,10%,52%)]">
                    {donation.food_category.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              
              <h3 className="font-bold text-[hsl(220,15%,15%)] text-lg mb-1 line-clamp-2">
                {donation.title}
              </h3>
              
              <div className="text-sm font-medium text-[hsl(220,10%,45%)] mb-4">
                {donation.quantity} {donation.quantity_unit}
              </div>

              <div className="mt-auto space-y-2 mb-5">
                <div className="flex items-center gap-2 text-xs text-[hsl(220,10%,52%)]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{donation.pickup_address || 'Address hidden'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: isExpired ? 'hsl(0,75%,50%)' : urgency.color }}>
                  {isExpired ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
                  <span>Expires: {isExpired ? 'Expired' : urgency.label}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-[hsl(220,13%,91%)]">
                <Link to={`/donor/donations/${donation.id}`} className="flex-1">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<Eye className="w-3.5 h-3.5" />}>
                    View Details
                  </Button>
                </Link>
                {donation.status === 'AVAILABLE' && (
                  <Button variant="ghost" size="sm" className="px-2" aria-label="Edit">
                    <Edit2 className="w-4 h-4 text-[hsl(220,10%,52%)]" />
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
