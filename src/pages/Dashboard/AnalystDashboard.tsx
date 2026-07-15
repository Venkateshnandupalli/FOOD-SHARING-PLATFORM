import React, { useEffect, useState } from 'react'
import { CloudRain, Activity, TrendingUp, PackageCheck, Building2, MapPin } from 'lucide-react'
import { Card, Spinner } from '@/components/ui'
import { analyticsService } from '@/services/analyticsService'
import type { ImpactMetrics, DemandForecast, TrendData } from '@/services/analyticsService'
import { DonationTrendChart } from '@/components/charts/DonationTrendChart'
import { DemandPieChart } from '@/components/charts/DemandPieChart'
import toast from 'react-hot-toast'

export default function AnalystDashboard() {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null)
  const [forecast, setForecast] = useState<DemandForecast[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [imp, fcast, trnd] = await Promise.all([
          analyticsService.getImpactMetrics(),
          analyticsService.getDemandForecast(),
          analyticsService.getDonationTrends()
        ])
        setMetrics(imp)
        setForecast(fcast)
        setTrends(trnd)
      } catch (err: any) {
        toast.error('Failed to load analytics: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading || !metrics) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const statCards = [
    { label: 'CO2 Prevented', value: `${metrics.co2PreventedKg.toLocaleString()} kg`, icon: CloudRain, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Total Meals Delivered', value: metrics.totalMeals.toLocaleString(), icon: PackageCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Water Saved', value: `${metrics.waterSavedLiters.toLocaleString()} L`, icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { label: 'Verified Orgs', value: metrics.verifiedOrgs.toLocaleString(), icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Active Users', value: metrics.activeUsers.toLocaleString(), icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-100' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics Overview</h1>
        <p className="text-gray-500 mt-1">Global platform metrics, AI demand forecasting, and historical trends.</p>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="p-5 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
            <div className={`p-3 rounded-xl ${stat.bg} mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col p-6">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Donation Volume (Last 7 Days)</h2>
              <button className="text-sm text-[hsl(210,80%,38%)] font-medium hover:underline">Export CSV</button>
            </div>
            <div className="flex-1 min-h-[300px]">
              <DonationTrendChart data={trends} />
            </div>
          </Card>
        </div>

        {/* Demand Forecasting Pie */}
        <div>
          <Card className="h-full flex flex-col p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">ML Demand Forecast</h2>
              <p className="text-xs text-gray-500 mt-1">Predicted needs across regions.</p>
            </div>
            <div className="flex-1 min-h-[250px]">
              <DemandPieChart data={forecast} />
            </div>
          </Card>
        </div>
      </div>

      {/* Geospatial Placeholder */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Geospatial Distribution</h2>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Live</span>
        </div>
        <div className="h-96 bg-[url('https://api.maptiler.com/maps/basic-v2/256/0/0/0.png')] bg-cover bg-center rounded-xl border border-gray-200 overflow-hidden relative grayscale opacity-70 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent opacity-50"></div>
            <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-xl shadow-sm text-center relative z-10">
               <h3 className="font-bold text-gray-800">Advanced Heatmaps Coming Soon</h3>
               <p className="text-sm text-gray-600 mt-1">Phase 11 introduces interactive density clustering.</p>
            </div>
        </div>
      </Card>
    </div>
  )
}
