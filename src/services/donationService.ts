import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Donation = Database['public']['Tables']['donations']['Row']
type DonationInsert = Database['public']['Tables']['donations']['Insert']
type DonationUpdate = Database['public']['Tables']['donations']['Update']
type DonationImage = Database['public']['Tables']['donation_images']['Row']

export const donationService = {
  // ─── Fetching ───────────────────────────────────────────────────────────────
  
  /** Fetch all donations created by a specific donor */
  async getDonorDonations(donorId: string): Promise<Donation[]> {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', donorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /** Fetch AI recommended matches for a specific organization */
  async getRecommendedMatches(orgId: string) {
    const { data, error } = await supabase.rpc('get_ai_recommended_matches', {
      p_org_id: orgId
    })

    if (error) throw error
    return data || []
  },

  /** Fetch all available donations (for recipients) */
  async getAvailableDonations(): Promise<any[]> {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        donation_images (*),
        profiles!donations_donor_id_fkey (full_name, profile_image_url)
      `)
      .eq('status', 'AVAILABLE')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /** Fetch a specific donation with its images */
  async getDonationById(id: string): Promise<{ donation: Donation, images: DonationImage[] }> {
    const [donationRes, imagesRes] = await Promise.all([
      supabase.from('donations').select('*').eq('id', id).single(),
      supabase.from('donation_images').select('*').eq('donation_id', id).order('is_primary', { ascending: false })
    ])

    if (donationRes.error) throw donationRes.error
    return {
      donation: donationRes.data,
      images: imagesRes.data || []
    }
  },

  // ─── Creation ───────────────────────────────────────────────────────────────

  /** Create a new donation */
  async createDonation(donation: DonationInsert): Promise<Donation> {
    const { data, error } = await supabase
      .from('donations')
      .insert(donation)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** Upload an image to the donation-images bucket */
  async uploadDonationImage(file: File, donationId: string, isPrimary: boolean = false): Promise<DonationImage> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${donationId}/${Math.random().toString(36).substring(2)}.${fileExt}`
    
    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('donation-images')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('donation-images')
      .getPublicUrl(fileName)

    // 3. Insert record into donation_images table
    const { data: imageRecord, error: dbError } = await supabase
      .from('donation_images')
      .insert({
        donation_id: donationId,
        image_url: publicUrl,
        is_primary: isPrimary
      })
      .select()
      .single()

    if (dbError) throw dbError
    return imageRecord
  },

  // ─── Management ─────────────────────────────────────────────────────────────

  /** Update donation status */
  async updateStatus(id: string, status: DonationUpdate['status']): Promise<Donation> {
    const { data, error } = await supabase
      .from('donations')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** Cancel a donation */
  async cancelDonation(id: string): Promise<void> {
    await this.updateStatus(id, 'CANCELLED')
  }
}
