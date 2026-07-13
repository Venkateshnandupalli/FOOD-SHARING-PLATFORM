import { supabase } from '@/lib/supabase'

export const profileService = {
  /**
   * Updates a user's profile information.
   * @param profileId The UUID of the profile
   * @param updates Object containing the fields to update
   */
  async updateProfile(profileId: string, updates: { full_name?: string; phone?: string; profile_image_url?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
