import { supabase } from '@/lib/supabase'

const API_BASE_URL = 'http://localhost:8000/api'

export const adminService = {
  /** Get list of organizations pending verification */
  async getPendingOrganizations() {
    const response = await fetch(`${API_BASE_URL}/admin/organizations/pending`)
    if (!response.ok) {
      throw new Error('Failed to get pending organizations from Python backend')
    }
    return response.json()
  },

  /** Update verification status of an organization */
  async updateOrganizationStatus(orgId: string, status: 'APPROVED' | 'REJECTED') {
    const response = await fetch(`${API_BASE_URL}/admin/organizations/${orgId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })

    if (!response.ok) {
      throw new Error('Failed to update organization status via Python backend')
    }

    return response.json()
  },

  /** Get system-wide metrics for the admin dashboard */
  async getSystemMetrics() {
    const response = await fetch(`${API_BASE_URL}/admin/metrics`)
    if (!response.ok) {
      throw new Error('Failed to get system metrics from Python backend')
    }
    return response.json()
  },
}
