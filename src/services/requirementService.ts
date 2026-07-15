import { supabase } from '@/lib/supabase'

export interface RecipientRequirement {
  id?: string
  recipient_organization_id: string
  food_category: string
  dietary_type?: string | null
  required_servings: number
  required_before: string
  delivery_preference: 'DELIVERY' | 'SELF_PICKUP' | 'EITHER'
  priority: number
  notes?: string | null
  status?: string
  created_at?: string
  updated_at?: string
}

export const requirementService = {
  /**
   * Fetch all requirements for a specific organization
   */
  async getRequirements(organizationId: string): Promise<RecipientRequirement[]> {
    const { data, error } = await supabase
      .from('recipient_requirements')
      .select('*')
      .eq('recipient_organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch requirements: ' + error.message)
    }

    return data || []
  },

  /**
   * Create a new requirement
   */
  async createRequirement(requirement: RecipientRequirement): Promise<RecipientRequirement> {
    const { data, error } = await (supabase as any)
      .from('recipient_requirements')
      .insert(requirement)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to create requirement: ' + error.message)
    }

    return data
  },

  /**
   * Delete a requirement
   */
  async deleteRequirement(id: string): Promise<void> {
    const { error } = await supabase
      .from('recipient_requirements')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('Failed to delete requirement: ' + error.message)
    }
  }
}
