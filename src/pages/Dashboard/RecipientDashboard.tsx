import React, { useEffect, useState } from 'react'
import { MapPin, Heart, Package, Clock, ArrowRight, CheckCircle, Star } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { StatCard, Card, Badge, Button, ProgressBar, Spinner, EmptyState } from '@/components/ui'
import { Plus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { organizationService } from '@/services/organizationService'
import { donationService } from '@/services/donationService'
import { matchService } from '@/services/matchService'
import { deliveryService } from '@/services/deliveryService'
import { RatingModal } from '@/components/RatingModal'
import { urgencyLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err.trim()) return err
  if (err && typeof err === 'object') {
    const maybeMessage = (err as { message?: unknown }).message || (err as any).error_description || (err as any).error
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage
    const maybeDetail = (err as { detail?: unknown }).detail
    if (typeof maybeDetail === 'string' && maybeDetail.trim()) return maybeDetail
    try {
      const str = JSON.stringify(err)
      if (str === '{}') return 'Something went wrong.'
      return str
    } catch {
      return 'Something went wrong.'
    }
  }
  return 'Something went wrong.'
}

export default function RecipientDashboard() {
  const { profile } = useAuthStore()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const [isLoading, setIsLoading] = useState(true)
  const [org, setOrg] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [ratingTarget, setRatingTarget] = useState<{
    deliveryId: string, 
    reviewedUserId: string, 
    reviewedUserName: string,
    defaultCategory: 'FOOD_QUALITY' | 'DELIVERY_EXPERIENCE'
  } | null>(null)
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    totalMealsClaimed: 0,
    wastePreventedLbs: 0
  })

  const loadData = async () => {
    if (!profile) return
    setIsLoading(true)
    try {
      const organization = await organizationService.getOrganizationByOwnerId(profile.id)
      setOrg(organization)
      
      if (organization && organization.verification_status === 'APPROVED') {
        const [pendingMatches, orgStats, orgDeliveries] = await Promise.all([
          matchService.getMatchesForRecipient(organization.id),
          organizationService.getOrganizationStats(organization.id),
          deliveryService.getDeliveriesForRecipient(organization.id)
        ])
        setMatches(pendingMatches || [])
        setStats(orgStats)
        setDeliveries(orgDeliveries || [])
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
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
      import('react-hot-toast').then(m => m.default.success('Donation accepted successfully!'))
      await loadData()
    } catch (err: unknown) {
      import('react-hot-toast').then(m => m.default.error('Failed to accept: ' + getErrorMessage(err)))
    } finally {
      setClaimingId(null)
    }
  }

  const handleReject = async (matchId: string) => {
    if (!org) return
    try {
      await matchService.rejectMatch(matchId, org.id)
      import('react-hot-toast').then(m => m.default.success('Match declined.'))
      await loadData()
    } catch (err: unknown) {
      import('react-hot-toast').then(m => m.default.error('Failed to decline: ' + getErrorMessage(err)))
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
              const donation = match.donations
              // Convert match score to percentage (0 to 100)
              const scorePercent = Math.round(Number(match.total_match_score) * 100)
              
              // Determine badge color based on score
              let badgeVariant: 'success' | 'warning' | 'default' = 'success'
              if (scorePercent < 75) badgeVariant = 'warning'
              if (scorePercent < 50) badgeVariant = 'default'

              // Expiry urgency
              const { label: urgLabel, color: urgColor } = urgencyLabel(donation.use_before)

              return (
                <Card key={match.id} className="flex flex-col hover:border-[hsl(25,95%,53%)] transition-colors overflow-hidden group">
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

                    {/* Content */}
                    <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">
                      {donation.title}
                    </h3>
                    <div className="space-y-2 mb-4 flex-1">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Package className="w-4 h-4 text-[hsl(25,95%,53%)]" />
                        {donation.quantity} {donation.quantity_unit} • {donation.food_category.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[hsl(25,95%,53%)]" />
                        {match.distance_km ? `${Number(match.distance_km).toFixed(1)} km away` : 'Location provided'}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[hsl(25,95%,53%)]" />
                        Expires {new Date(match.expires_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>

                    {/* Explanations */}
                    {match.score_explanation && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mb-4 space-y-1">
                        {Object.values(match.score_explanation).map((v: any, i) => (
                          <div key={i}>• {v}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="bg-gray-50 border-t border-gray-100 p-4 flex gap-2">
                    <Button 
                      variant="primary" 
                      fullWidth 
                      className="bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] flex-1"
                      rightIcon={<CheckCircle className="w-4 h-4" />}
                      isLoading={claimingId === match.donation_id}
                      onClick={() => handleAccept(match.donation_id)}
                    >
                      Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleReject(match.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Recent Deliveries ── */}
      {deliveries.length > 0 && (
        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Deliveries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliveries.map((del) => {
              const d = del.match?.donation
              const isCompleted = del.status === 'DELIVERED'
              if (!d) return null

              return (
                <Card key={del.id} className="p-5 flex flex-col hover:border-[hsl(25,95%,53%)] transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={isCompleted ? 'default' : 'success'} className="bg-[hsl(25,95%,95%)] text-[hsl(25,95%,53%)]">
                      {del.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{d.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{d.quantity} {d.quantity_unit} • {d.food_category.replace(/_/g, ' ')}</p>

                  {isCompleted && (
                    <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        fullWidth
                        onClick={() => setRatingTarget({
                          deliveryId: del.id,
                          reviewedUserId: d.donor_id,
                          reviewedUserName: 'Donor',
                          defaultCategory: 'FOOD_QUALITY'
                        })}
                      >
                        Rate Donor
                      </Button>
                      {del.volunteer && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          fullWidth
                          onClick={() => setRatingTarget({
                            deliveryId: del.id,
                            reviewedUserId: del.volunteer.id,
                            reviewedUserName: del.volunteer.full_name,
                            defaultCategory: 'DELIVERY_EXPERIENCE'
                          })}
                        >
                          Rate Volunteer
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
        <Card className="p-6 flex flex-col justify-between items-start bg-primary/5 border-primary/20">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Publish Your Needs</h3>
            <p className="text-gray-600 text-sm mb-4">Let donors know what food you need so we can match you faster.</p>
          </div>
          <Link to="/recipient/requirements">
            <Button variant="primary" size="sm" className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Manage Requirements
            </Button>
          </Link>
        </Card>
      </div>

      {/* ── Impact Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
        <StatCard
          title="Total Meals Claimed"
          value={stats.totalMealsClaimed.toString()}
          icon={<Heart className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="Active Deliveries"
          value={stats.activeDeliveries.toString()}
          icon={<Package className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Waste Prevented (lbs)"
          value={stats.wastePreventedLbs.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Rating Modal */}
      {ratingTarget && profile && (
        <RatingModal
          isOpen={!!ratingTarget}
          onClose={() => setRatingTarget(null)}
          deliveryId={ratingTarget.deliveryId}
          reviewerId={profile.id}
          reviewedUserId={ratingTarget.reviewedUserId}
          reviewedUserName={ratingTarget.reviewedUserName}
          defaultCategory={ratingTarget.defaultCategory}
        />
      )}
    </div>
  )
}
