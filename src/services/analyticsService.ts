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

import { fetchApi } from '@/lib/api'

export const analyticsService = {
  /** Get Global Impact Metrics from Python Backend */
  async getImpactMetrics(): Promise<ImpactMetrics> {
    return fetchApi('/analytics/impact')
  },

  /** Get Demand Forecast hotspots from Python Backend */
  async getDemandForecast(): Promise<DemandForecast[]> {
    return fetchApi('/analytics/demand-forecast')
  },

  /** Get last 7 days donation trends from Python Backend */
  async getDonationTrends(): Promise<TrendData[]> {
    return fetchApi('/analytics/donation-trends')
  }
}
