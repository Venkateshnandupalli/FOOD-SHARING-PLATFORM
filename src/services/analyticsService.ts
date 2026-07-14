export interface ImpactMetrics {
  totalMeals: number
  co2PreventedKg: number
  waterSavedLiters: number
  activeUsers: number
  verifiedOrgs: number
}

export interface DemandForecast {
  food_category: string
  total_requested: number
  active_requests: number
  current_supply: number
  demand_score: number
}

export interface TrendData {
  date: string
  donations: number
}

// Hardcoded for now. In production, this would be an environment variable.
const API_BASE_URL = 'http://localhost:8000/api'

export const analyticsService = {
  /** Get Global Impact Metrics from Python Backend */
  async getImpactMetrics(): Promise<ImpactMetrics> {
    const response = await fetch(`${API_BASE_URL}/analytics/impact`)
    if (!response.ok) throw new Error('Failed to fetch impact metrics from Python backend')
    return response.json()
  },

  /** Get Demand Forecast hotspots from Python Backend */
  async getDemandForecast(): Promise<DemandForecast[]> {
    const response = await fetch(`${API_BASE_URL}/analytics/demand-forecast`)
    if (!response.ok) throw new Error('Failed to fetch demand forecast from Python backend')
    return response.json()
  },

  /** Get last 7 days donation trends from Python Backend */
  async getDonationTrends(): Promise<TrendData[]> {
    const response = await fetch(`${API_BASE_URL}/analytics/donation-trends`)
    if (!response.ok) throw new Error('Failed to fetch donation trends from Python backend')
    return response.json()
  }
}
