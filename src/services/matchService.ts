import { supabase } from '@/lib/supabase'

export const matchService = {
  /**
   * Manually accept a donation from the Browse page.
   * This creates a match and updates the donation status.
   */
  async acceptDonation(donationId: string, recipientOrganizationId: string) {
    // 1. Create the Match
    const { error: matchError } = await supabase
      .from('matches')
      .insert({
        donation_id: donationId,
        recipient_organization_id: recipientOrganizationId,
        distance_km: 0, // Mock distance since it's a manual claim
        match_status: 'ACCEPTED',
        urgency_score: 1.0, // Manual claim gets highest priority
        demand_score: 1.0,
        capacity_score: 1.0,
        reliability_score: 1.0,
        total_match_score: 1.0
      })

    if (matchError) {
      throw new Error('Failed to create match: ' + matchError.message)
    }

    // 2. Update Donation Status
    const { error: donationError } = await supabase
      .from('donations')
      .update({ status: 'MATCHED' })
      .eq('id', donationId)

    if (donationError) {
      throw new Error('Failed to update donation status: ' + donationError.message)
    }

    return true
  }
}
