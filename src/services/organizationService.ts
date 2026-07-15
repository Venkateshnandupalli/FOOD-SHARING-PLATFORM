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
    const { data, error } = await (supabase as any)
      .from('organizations')
      .insert(org)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** Fetch impact statistics for an organization */
  async getOrganizationStats(orgId: string) {
    // 1. Get active deliveries count
    const { count: activeDeliveries } = await supabase
      .from('deliveries')
      .select('id, matches!inner(recipient_organization_id)', { count: 'exact', head: true })
      .eq('matches.recipient_organization_id', orgId)
      .in('status', ['ASSIGNED', 'EN_ROUTE_PICKUP', 'COLLECTED', 'EN_ROUTE_DELIVERY'])

    // 2. Get accepted matches to calculate meals and waste
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id,
        donations(estimated_servings, quantity, quantity_unit)
      `)
      .eq('recipient_organization_id', orgId)
      .eq('match_status', 'ACCEPTED')

    let totalMeals = 0
    let totalWasteLbs = 0

    if (matches) {
      for (const m of matches) {
        // @ts-ignore
        const d = Array.isArray(m.donations) ? m.donations[0] : m.donations
        if (!d) continue
        
        totalMeals += Number(d.estimated_servings) || 0
        
        const q = Number(d.quantity) || 0
        if (d.quantity_unit === 'kg' || d.quantity_unit === 'liters') {
          totalWasteLbs += q * 2.20462
        }
      }
    }

    return {
      activeDeliveries: activeDeliveries || 0,
      totalMealsClaimed: totalMeals,
      wastePreventedLbs: Math.round(totalWasteLbs)
    }
  }
}
