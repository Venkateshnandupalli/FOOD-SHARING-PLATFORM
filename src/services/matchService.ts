import { supabase } from '@/lib/supabase'

const API_BASE_URL = 'http://localhost:8000/api'

export const matchService = {
  /**
   * Manually accept a donation from the Browse page.
   * This creates a match and updates the donation status.
   */
  async acceptDonation(donationId: string, recipientOrganizationId: string) {
    const response = await fetch(`${API_BASE_URL}/matches/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donation_id: donationId, recipient_org_id: recipientOrganizationId })
    })

    if (!response.ok) {
      throw new Error('Failed to accept donation via Python backend')
    }

    return true
  },

  /**
   * AI Proactive Matching - Generates matches for a donation
   */
  async generateMatches(donationId: string): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/matches/generate/${donationId}`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to generate matches via Python backend')
    }

    const data = await response.json()
    return data.generated_count || 0
  },

  /**
   * Get matches for a specific donation (for Donor view)
   */
  async getMatchesForDonation(donationId: string) {
    const response = await fetch(`${API_BASE_URL}/matches/donation/${donationId}`)
    if (!response.ok) {
      throw new Error('Failed to get matches from Python backend')
    }
    return response.json()
  },

  /**
   * Get pending matches for a specific recipient organization
   */
  async getMatchesForRecipient(orgId: string) {
    const response = await fetch(`${API_BASE_URL}/matches/recipient/${orgId}`)
    if (!response.ok) {
      throw new Error('Failed to get matches for recipient from Python backend')
    }
    return response.json()
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
