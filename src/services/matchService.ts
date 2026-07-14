import { supabase } from '@/lib/supabase'

export const matchService = {
  /**
   * Manually accept a donation from the Browse page.
   * This creates a match and updates the donation status.
   */
  async acceptDonation(donationId: string, recipientOrganizationId: string) {
    const { error } = await supabase.rpc('accept_donation', {
      p_donation_id: donationId,
      p_org_id: recipientOrganizationId
    })

    if (error) {
      throw new Error('Failed to accept donation: ' + error.message)
    }

    return true
  },

  /**
   * AI Proactive Matching - Generates matches for a donation
   */
  async generateMatches(donationId: string): Promise<number> {
    const { data, error } = await supabase.rpc('generate_matches_for_donation', {
      p_donation_id: donationId
    })

    if (error) {
      throw new Error('Failed to generate matches: ' + error.message)
    }

    return data || 0
  },

  /**
   * Get matches for a specific donation (for Donor view)
   */
  async getMatchesForDonation(donationId: string) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        organizations ( organization_name, contact_phone )
      `)
      .eq('donation_id', donationId)
      .order('total_match_score', { ascending: false })

    if (error) {
      throw new Error('Failed to get matches: ' + error.message)
    }

    return data || []
  },

  /**
   * Get pending matches for a specific recipient organization
   */
  async getMatchesForRecipient(orgId: string) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        donations ( title, food_category, quantity, quantity_unit, use_before, pickup_address )
      `)
      .eq('recipient_organization_id', orgId)
      .eq('match_status', 'PENDING')
      .order('generated_at', { ascending: false })

    if (error) {
      throw new Error('Failed to get matches: ' + error.message)
    }

    return data || []
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
