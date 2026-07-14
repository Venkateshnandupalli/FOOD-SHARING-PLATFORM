import { supabase } from '@/lib/supabase'
import { fetchApi } from '@/lib/api'

export const adminService = {
  /** Get list of organizations pending verification */
  async getPendingOrganizations() {
    return fetchApi('/admin/organizations/pending')
  },

  /** Update verification status of an organization */
  async updateOrganizationStatus(orgId: string, status: 'APPROVED' | 'REJECTED') {
    return fetchApi(`/admin/organizations/${orgId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  },

  /** Get system-wide metrics for the admin dashboard */
  async getSystemMetrics() {
    return fetchApi('/admin/metrics')
  },
}
