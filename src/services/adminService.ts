import { supabase } from '@/lib/supabase'

export const adminService = {
  /** Fetch all pending organizations for verification */
  async getPendingOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        owner:profiles(full_name, phone)
      `)
      .eq('verification_status', 'PENDING')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /** Update verification status of an organization */
  async updateOrganizationStatus(orgId: string, status: 'APPROVED' | 'REJECTED') {
    const { error } = await supabase
      .from('organizations')
      .update({ verification_status: status })
      .eq('id', orgId)

    if (error) throw error
    return true
  },

  /** Fetch system overview metrics */
  async getSystemMetrics() {
    const [orgsRes, usersRes, donationsRes, deliveriesRes] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('verification_status', 'APPROVED'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('donations').select('id', { count: 'exact', head: true }),
      supabase.from('deliveries').select('id', { count: 'exact', head: true }).eq('status', 'DELIVERED')
    ])

    return {
      totalApprovedOrgs: orgsRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalDonations: donationsRes.count || 0,
      successfulDeliveries: deliveriesRes.count || 0
    }
  }
}
