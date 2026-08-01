import React, { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Package } from 'lucide-react'
import { Card, StatCard, Badge, Spinner, EmptyState } from '@/components/ui'
import { analyticsService, type TrendData, type DemandForecast } from '@/services/analyticsService'
import { DonationTrendChart } from '@/components/charts/DonationTrendChart'
import { DemandPieChart } from '@/components/charts/DemandPieChart'
import { supabase } from '@/lib/supabase'

const CATEGORY_COLORS: Record<string, string> = {
  COOKED_MEALS:      '#22c55e',
  BAKERY:            '#f59e0b',
  FRUITS_VEGETABLES: '#84cc16',
  PACKAGED_FOOD:     '#3b82f6',
  DAIRY:             '#8b5cf6',
  BEVERAGES:         '#06b6d4',
  SNACKS:            '#f97316',
  GRAINS_PULSES:     '#a78bfa',
  OTHER:             '#6b7280',
}

export default function DonationAnalytics() {
  const [trends, setTrends] = useState<TrendData[]>([])
  const [forecast, setForecast] = useState<DemandForecast[]>([])
  const [categoryData, setCategoryData] = useState<{ category: string; count: number; total_qty: number }[]>([])
  const [topDonors, setTopDonors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const [trendData, forecastData] = await Promise.all([
          analyticsService.getDonationTrends(),
          analyticsService.getDemandForecast(),
        ])
        setTrends(trendData)
        setForecast(forecastData)

        // Category breakdown from Supabase
        const { data: catData } = await (supabase as any)
          .from('donations')
          .select('food_category, quantity')
          .not('food_category', 'is', null)
        
        if (catData) {
          const grouped: Record<string, { count: number; total_qty: number }> = {}
          for (const d of (catData as any[])) {
            if (!grouped[d.food_category]) grouped[d.food_category] = { count: 0, total_qty: 0 }
            grouped[d.food_category].count += 1
            grouped[d.food_category].total_qty += Number(d.quantity) || 0
          }
          setCategoryData(
            Object.entries(grouped)
              .map(([category, val]) => ({ category, ...val }))
              .sort((a, b) => b.count - a.count)
          )
        }

        // Top donors
        const { data: donorData } = await (supabase as any)
          .from('donations')
          .select('donor_id, donor:profiles!donor_id(full_name), estimated_servings')
          .eq('status', 'DELIVERED')

        if (donorData) {
          const donorMap: Record<string, { name: string; meals: number; donations: number }> = {}
          for (const d of (donorData as any[])) {
            const donor = d.donor as any
            if (!donor?.full_name) continue
            if (!donorMap[d.donor_id]) donorMap[d.donor_id] = { name: donor.full_name, meals: 0, donations: 0 }
            donorMap[d.donor_id].meals += Number(d.estimated_servings) || 0
            donorMap[d.donor_id].donations += 1
          }
          setTopDonors(
            Object.values(donorMap).sort((a, b) => b.meals - a.meals).slice(0, 10)
          )
        }
      } catch {
        // graceful
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const totalDonations = categoryData.reduce((s, c) => s + c.count, 0)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Donation Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Deep-dive into donation patterns and supply trends.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Donations"
          value={totalDonations}
          icon={<Package className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Categories Tracked"
          value={categoryData.length}
          icon={<BarChart3 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Top Demand Category"
          value={forecast[0]?.food_category.replace(/_/g, ' ') || 'N/A'}
          icon={<TrendingUp className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Trend + Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-bold text-gray-900 mb-1">Donation Volume Trend</h2>
          <p className="text-sm text-gray-500 mb-4">Trailing 7-day donation submissions</p>
          <div className="h-64">
            <DonationTrendChart data={trends} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-1">ML Demand Forecast</h2>
          <p className="text-sm text-gray-500 mb-4">Supply vs. active requirements</p>
          <div className="h-48 mb-4">
            <DemandPieChart data={forecast} />
          </div>
          <div className="space-y-2">
            {forecast.slice(0, 4).map((f) => (
              <div key={f.food_category} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium truncate">{f.food_category.replace(/_/g, ' ')}</span>
                <Badge variant={f.demand_score > 10 ? 'danger' : f.demand_score > 5 ? 'warning' : 'info'} className="ml-2 shrink-0">
                  {Math.round(f.demand_score * 10) / 10}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h2 className="font-bold text-gray-900 mb-4">Category Breakdown</h2>
        <div className="space-y-3">
          {categoryData.map(({ category, count }) => {
            const pct = totalDonations > 0 ? Math.round((count / totalDonations) * 100) : 0
            const color = CATEGORY_COLORS[category] ?? '#6b7280'
            return (
              <div key={category} className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                <span className="w-40 text-sm font-medium text-gray-700 shrink-0 truncate">
                  {category.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <span className="w-14 text-sm font-bold text-gray-700 text-right shrink-0">
                  {count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span>
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Top Donors */}
      {topDonors.length > 0 && (
        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Donors by Meals Delivered</h2>
          <div className="space-y-3">
            {topDonors.map((d, i) => (
              <div key={d.name} className="flex items-center gap-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                }`}>
                  {i + 1}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800 truncate">{d.name}</span>
                <span className="text-sm text-gray-500">{d.donations} donation{d.donations !== 1 ? 's' : ''}</span>
                <span className="text-sm font-bold text-[hsl(142,71%,28%)] w-20 text-right">{d.meals.toLocaleString()} meals</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
