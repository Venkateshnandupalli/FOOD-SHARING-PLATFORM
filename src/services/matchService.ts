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
  }
}
