import { supabase } from '@/lib/supabase'

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
    const { data, error } = await supabase.rpc('get_available_deliveries')
    if (error) throw error
    return data || []
  },

  /** Claim a delivery */
  async claimDelivery(matchId: string, volunteerId: string) {
    const { error } = await supabase
      .from('deliveries')
      .insert({
        match_id: matchId,
        volunteer_id: volunteerId,
        status: 'ASSIGNED',
        scheduled_pickup_at: new Date().toISOString()
      })
    
    if (error) throw error
    return true
  },

  /** Fetch active deliveries for the volunteer */
  async getMyDeliveries(volunteerId: string) {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        match:matches(
          *,
          donation:donations(*),
          recipient:organizations(*)
        )
      `)
      .eq('volunteer_id', volunteerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /** Update delivery status */
  async updateStatus(deliveryId: string, status: 'EN_ROUTE_PICKUP' | 'COLLECTED' | 'EN_ROUTE_DELIVERY' | 'DELIVERED', proofUrl?: string) {
    const updates: any = { status }
    
    if (status === 'COLLECTED') updates.collected_at = new Date().toISOString()
    if (status === 'DELIVERED') {
      updates.delivered_at = new Date().toISOString()
      if (proofUrl) updates.delivery_proof_url = proofUrl
    }

    const { error } = await supabase
      .from('deliveries')
      .update(updates)
      .eq('id', deliveryId)

    if (error) throw error
    return true
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
