import { supabase } from '@/lib/supabase'

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

export const analyticsService = {
  /** Get Global Impact Metrics */
  async getImpactMetrics(): Promise<ImpactMetrics> {
    const { data, error } = await supabase.rpc('get_impact_metrics')
    if (error) throw new Error('Failed to fetch impact metrics: ' + error.message)
    return data as ImpactMetrics
  },

  /** Get Demand Forecast hotspots */
  async getDemandForecast(): Promise<DemandForecast[]> {
    const { data, error } = await supabase.rpc('get_demand_forecast')
    if (error) throw new Error('Failed to fetch demand forecast: ' + error.message)
    return data as DemandForecast[]
  },

  /** Get last 7 days donation trends */
  async getDonationTrends(): Promise<TrendData[]> {
    const { data, error } = await supabase.rpc('get_donation_trends')
    if (error) throw new Error('Failed to fetch donation trends: ' + error.message)
    return data as TrendData[]
  }
}
