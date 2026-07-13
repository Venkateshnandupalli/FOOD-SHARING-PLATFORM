import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, ArrowRight, Filter, Search } from 'lucide-react'
import { Button, Input, Card, Badge, Spinner, EmptyState } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { donationService } from '@/services/donationService'
import { organizationService } from '@/services/organizationService'
import { matchService } from '@/services/matchService'
import { urgencyLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function BrowseDonations() {
  const { profile } = useAuthStore()
  const [donations, setDonations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await donationService.getAvailableDonations()
        setDonations(data)
      } catch (err: any) {
        toast.error('Failed to load available donations: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filteredDonations = donations.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.food_category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAccept = async (donationId: string) => {
    if (!profile) return
    setAcceptingId(donationId)
    try {
      const org = await organizationService.getOrganizationByOwnerId(profile.id)
      if (!org) {
        toast.error('You need an Organization profile to claim food!')
        return
      }

      await matchService.acceptDonation(donationId, org.id)
      
      toast.success('Donation accepted successfully! You have been matched.')
      // Remove from list
      setDonations(prev => prev.filter(d => d.id !== donationId))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Available Food</h1>
          <p className="text-gray-500 mt-1">Find and claim surplus food from local donors</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search food or category..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="shrink-0">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" color="primary" />
        </div>
      ) : filteredDonations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-8 h-8" />}
          title="No food available nearby"
          description="There are currently no active donations matching your search."
          action={
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.map(donation => {
            const primaryImage = donation.donation_images?.find((img: any) => img.is_primary)?.image_url
              || donation.donation_images?.[0]?.image_url
              || 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=600'
            
            const { label, color } = urgencyLabel(donation.use_before)
            const donorName = donation.profiles?.full_name || 'Anonymous Donor'

            return (
              <Card key={donation.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-48 relative overflow-hidden bg-gray-100">
                  <img 
                    src={primaryImage} 
                    alt={donation.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className={`bg-${color}-100 text-${color}-800 border-none font-medium backdrop-blur-sm bg-opacity-90`}>
                      <Clock className="w-3 h-3 mr-1 inline" />
                      {label}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{donation.title}</h3>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="line-clamp-1">{donation.pickup_address}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="default" className="bg-gray-50">
                      {donation.quantity} {donation.quantity_unit}
                    </Badge>
                    <Badge variant="default" className="bg-gray-50">
                      {donation.food_category.replace('_', ' ')}
                    </Badge>
                    <Badge variant="default" className="bg-gray-50">
                      {donation.dietary_type}
                    </Badge>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {donorName.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{donorName}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleAccept(donation.id)}
                      isLoading={acceptingId === donation.id}
                    >
                      Accept <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
