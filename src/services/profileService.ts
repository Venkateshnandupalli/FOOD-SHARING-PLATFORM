import { supabase } from '@/lib/supabase'

export const profileService = {
  /**
   * Updates a user's profile information.
   * @param profileId The UUID of the profile
   * @param updates Object containing the fields to update
   */
  async updateProfile(profileId: string, updates: { full_name?: string; phone?: string; profile_image_url?: string }) {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Fetches a user's profile information.
   * @param profileId The UUID of the profile
   */
  async getProfile(profileId: string) {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error) throw error
    return data
  }
}
