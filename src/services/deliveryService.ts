import { supabase } from '@/lib/supabase'
import { fetchApi } from '@/lib/api'

export interface AvailableDelivery {
  match_id: string
  donation_title: string
  donor_name: string
  donor_address: string
  donor_lat: number
  donor_lng: number
  recipient_name: string
  recipient_address: string
  recipient_lat: number
  recipient_lng: number
  food_category: string
  quantity: number
  quantity_unit: string
}

export const deliveryService = {
  /** Fetch matches that need a driver */
  async getAvailableDeliveries(): Promise<AvailableDelivery[]> {
    return fetchApi('/deliveries/available')
  },

  /** Claim a delivery */
  async claimDelivery(matchId: string, volunteerId: string) {
    return fetchApi('/deliveries/claim', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId, volunteer_id: volunteerId })
    })
  },

  /** Fetch active deliveries for the volunteer */
  async getMyDeliveries(volunteerId: string) {
    return fetchApi(`/deliveries/volunteer/${volunteerId}`)
  },

  /** Fetch deliveries for a donor */
  async getDeliveriesForDonor(donorId: string) {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        match:matches!inner(
          *,
          donation:donations!inner(*),
          recipient:organizations(*)
        )
      `)
      .eq('match.donation.donor_id', donorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /** Fetch deliveries for a recipient organization */
  async getDeliveriesForRecipient(orgId: string) {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        match:matches!inner(
          *,
          donation:donations(*),
          recipient:organizations!inner(*)
        ),
        volunteer:profiles!volunteer_id(*)
      `)
      .eq('match.recipient_organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /** Update delivery status */
  async updateDeliveryStatus(deliveryId: string, status: string) {
    return fetchApi(`/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  },

  /** Upload delivery proof image */
  async uploadDeliveryProof(file: File, deliveryId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${deliveryId}-${Date.now()}.${fileExt}`
    const filePath = `proofs/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('delivery-proofs')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('delivery-proofs')
      .getPublicUrl(filePath)

    return data.publicUrl
  }
}
