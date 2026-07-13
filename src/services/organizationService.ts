import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']

export const organizationService = {
  /** Fetch an organization by its owner's profile ID */
  async getOrganizationByOwnerId(ownerId: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /** Create a new organization */
  async createOrganization(org: OrganizationInsert): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .insert(org)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
