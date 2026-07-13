import React, { useEffect, useState } from 'react'
import { MapPin, Heart, Package, Clock, ArrowRight, CheckCircle, Star } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { StatCard, Card, Badge, Button, ProgressBar, Spinner, EmptyState } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { organizationService } from '@/services/organizationService'
import { donationService } from '@/services/donationService'
import { matchService } from '@/services/matchService'
import { urgencyLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function RecipientDashboard() {
  const { profile } = useAuthStore()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const [isLoading, setIsLoading] = useState(true)
  const [org, setOrg] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const loadData = async () => {
    if (!profile) return
    setIsLoading(true)
    try {
      const organization = await organizationService.getOrganizationByOwnerId(profile.id)
      setOrg(organization)
      
      if (organization && organization.verification_status === 'APPROVED') {
        const recommended = await donationService.getRecommendedMatches(organization.id)
        setMatches(recommended || [])
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile])

  const handleAccept = async (donationId: string) => {
    if (!org) return
    setClaimingId(donationId)
    try {
      await matchService.acceptDonation(donationId, org.id)
      toast.success('Donation accepted successfully!')
      await loadData()
    } catch (err: any) {
      toast.error('Failed to accept: ' + err.message)
    } finally {
      setClaimingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  // If no org exists, redirect to onboarding
  if (!org) return <Navigate to="/recipient/onboarding" replace />

  // If org exists but pending
  if (org.verification_status === 'PENDING') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-10">
        <EmptyState 
          icon={<Clock className="w-10 h-10 text-orange-400" />}
          title="Verification in Progress"
          description={`Your organization '${org.organization_name}' is currently being reviewed by our admins. You will gain access to the matching engine once approved!`}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Hi {firstName}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Here are the best food matches for {org.organization_name} today.
          </p>
        </div>
        <Link to="/recipient/browse">
          <Button variant="outline" className="shrink-0 bg-white shadow-sm border-gray-200">
            Browse All Donations <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* ── AI Recommendation Engine Section ── */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-[hsl(25,95%,95%)] text-[hsl(25,95%,53%)] rounded-xl">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">AI Recommended Matches</h2>
          <Badge variant="warning" className="ml-2 font-medium">Auto-scored by Urgency & Distance</Badge>
        </div>

        {matches.length === 0 ? (
          <EmptyState 
            icon={<Package className="w-8 h-8 text-gray-400" />}
            title="No matches found"
            description="There are currently no donations available within 50km of your organization."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => {
              // Convert match score to percentage (0 to 100)
              const scorePercent = Math.round(Number(match.match_score))
              
              // Determine badge color based on score
              let badgeVariant: 'success' | 'warning' | 'default' = 'success'
              if (scorePercent < 75) badgeVariant = 'warning'
              if (scorePercent < 50) badgeVariant = 'default'

              // Expiry urgency
              const { label: urgLabel, color: urgColor } = urgencyLabel(match.use_before)

              return (
                <Card key={match.donation_id} className="flex flex-col hover:border-[hsl(25,95%,53%)] transition-colors overflow-hidden group">
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant={badgeVariant} className="flex items-center gap-1 font-bold">
                        {scorePercent}% Match
                      </Badge>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgColor}`}>
                        {urgLabel}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[hsl(25,95%,53%)] transition-colors">
                      {match.title}
                    </h3>

                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-900 mr-1">{Number(match.quantity)} {match.quantity_unit}</span>
                        ({match.food_category.replace(/_/g, ' ')})
                      </div>
                      
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          <span className="font-medium">{match.distance_km.toFixed(1)} km away</span><br/>
                          <span className="text-xs text-gray-500">{match.pickup_address}</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar (Visual indicator of score) */}
                    <div className="mb-6">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
                        <span>Match Quality</span>
                        <span>{scorePercent}/100</span>
                      </div>
                      <ProgressBar 
                        progress={scorePercent} 
                        color={scorePercent > 75 ? 'green' : 'orange'} 
                        size="sm" 
                      />
                    </div>

                    {/* Action */}
                    <Button 
                      className="w-full shadow-sm hover:shadow-md transition-shadow" 
                      onClick={() => handleAccept(match.donation_id)}
                      isLoading={claimingId === match.donation_id}
                    >
                      Accept Donation
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Impact Overview (Placeholder) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
        <StatCard
          title="Total Meals Claimed"
          value="0"
          icon={<Heart className="w-5 h-5" />}
          color="text-red-500"
          bg="bg-red-50"
        />
        <StatCard
          title="Active Deliveries"
          value="0"
          icon={<Package className="w-5 h-5" />}
          color="text-blue-500"
          bg="bg-blue-50"
        />
        <StatCard
          title="Waste Prevented (lbs)"
          value="0"
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-green-500"
          bg="bg-green-50"
        />
      </div>
    </div>
  )
}
