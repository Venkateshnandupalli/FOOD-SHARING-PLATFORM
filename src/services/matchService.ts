import { supabase } from '@/lib/supabase'
import { fetchApi } from '@/lib/api'

export const matchService = {
  /**
   * Manually accept a donation from the Browse page.
   * This creates a match and updates the donation status.
   */
  async acceptDonation(donationId: string, recipientOrganizationId: string) {
    return fetchApi('/matches/accept', {
      method: 'POST',
      body: JSON.stringify({ donation_id: donationId, recipient_org_id: recipientOrganizationId })
    })
  },

  /**
   * AI Proactive Matching - Generates matches for a donation
   */
  async generateMatches(donationId: string): Promise<number> {
    const data = await fetchApi(`/matches/generate/${donationId}`, {
      method: 'POST'
    })
    return data.generated_count || 0
  },

  /**
   * Get matches for a specific donation (for Donor view)
   */
  async getMatchesForDonation(donationId: string) {
    return fetchApi(`/matches/donation/${donationId}`)
  },

  /**
   * Get pending matches for a specific recipient organization
   */
  async getMatchesForRecipient(orgId: string) {
    return fetchApi(`/matches/recipient/${orgId}`)
  },

  /**
   * Explicitly reject a pending match
   */
  async rejectMatch(matchId: string, orgId: string) {
    const { error } = await supabase.rpc('reject_match', {
      p_match_id: matchId,
      p_org_id: orgId
    })

    if (error) {
      throw new Error('Failed to reject match: ' + error.message)
    }

    return true
  }
}
