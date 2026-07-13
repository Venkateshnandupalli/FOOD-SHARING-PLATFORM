import { supabase } from '@/lib/supabase'

export interface ImpactData {
  totalMeals: number
  totalCo2SavedLbs: number
  totalWaterSavedGallons: number
  donationsByMonth: { name: string; meals: number }[]
  donationsByCategory: { name: string; value: number }[]
}

export const impactService = {
  /** Fetch and calculate impact metrics for a donor */
  async getDonorImpact(donorId: string): Promise<ImpactData> {
    const { data: rawData, error } = await supabase
      .from('donations')
      .select('created_at, quantity, quantity_unit, food_category, status')
      .eq('donor_id', donorId)
      .in('status', ['MATCHED', 'DELIVERED']) // Only count successful donations

    if (error) throw error

    const donations = rawData as any[]

    let totalMeals = 0
    const monthlyData: Record<string, number> = {}
    const categoryData: Record<string, number> = {}

    // Initialize last 6 months for the chart
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthStr = d.toLocaleString('default', { month: 'short' })
      monthlyData[monthStr] = 0
    }

    donations?.forEach(d => {
      // Normalize quantity to meals
      let meals = 0
      const q = Number(d.quantity)
      if (d.quantity_unit === 'servings') meals = q
      else if (d.quantity_unit === 'kg') meals = q * 2.2
      else if (d.quantity_unit === 'lbs') meals = q * 0.8
      else meals = q

      totalMeals += meals

      // Group by month
      const date = new Date(d.created_at)
      const monthStr = date.toLocaleString('default', { month: 'short' })
      if (monthlyData[monthStr] !== undefined) {
        monthlyData[monthStr] += meals
      }

      // Group by category
      const cat = d.food_category.replace(/_/g, ' ')
      categoryData[cat] = (categoryData[cat] || 0) + meals
    })

    // Prepare chart data formats
    const donationsByMonth = Object.keys(monthlyData).map(key => ({
      name: key,
      meals: Math.round(monthlyData[key])
    }))

    const donationsByCategory = Object.keys(categoryData).map(key => ({
      name: key,
      value: Math.round(categoryData[key])
    }))

    // CO2 ratio: ~3.8 lbs of CO2 saved per meal equivalent
    // Water ratio: ~150 gallons saved per meal equivalent
    return {
      totalMeals: Math.round(totalMeals),
      totalCo2SavedLbs: Math.round(totalMeals * 3.8),
      totalWaterSavedGallons: Math.round(totalMeals * 150),
      donationsByMonth,
      donationsByCategory
    }
  }
}
