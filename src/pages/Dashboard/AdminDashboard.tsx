import React, { useEffect, useState } from 'react'
import { Users, Building2, PackageCheck, Truck, ShieldCheck, XCircle, CheckCircle } from 'lucide-react'
import { Card, Badge, Button, EmptyState, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { adminService } from '@/services/adminService'
import { analyticsService } from '@/services/analyticsService'
import type { ImpactMetrics, DemandForecast, TrendData } from '@/services/analyticsService'
import { DonationTrendChart } from '@/components/charts/DonationTrendChart'
import { DemandPieChart } from '@/components/charts/DemandPieChart'
import { CloudRain, Activity, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { profile } = useAuthStore()
  
  const [metrics, setMetrics] = useState<any>(null)
  const [impact, setImpact] = useState<ImpactMetrics | null>(null)
  const [forecast, setForecast] = useState<DemandForecast[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [sysMetrics, orgs, imp, fcast, trnd] = await Promise.all([
        adminService.getSystemMetrics(),
        adminService.getPendingOrganizations(),
        analyticsService.getImpactMetrics(),
        analyticsService.getDemandForecast(),
        analyticsService.getDonationTrends()
      ])
      setMetrics(sysMetrics)
      setPendingOrgs(orgs)
      setImpact(imp)
      setForecast(fcast)
      setTrends(trnd)
    } catch (err: any) {
      toast.error('Failed to load admin data: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateStatus = async (orgId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(orgId)
    try {
      await adminService.updateOrganizationStatus(orgId, status)
      toast.success(`Organization ${status.toLowerCase()} successfully`)
      await loadData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const statCards = [
    { label: 'CO2 Prevented', value: `${impact?.co2PreventedKg || 0} kg`, icon: CloudRain, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Total Meals Delivered', value: impact?.totalMeals || 0, icon: PackageCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Water Saved', value: `${impact?.waterSavedLiters || 0} L`, icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { label: 'Verified Orgs', value: impact?.verifiedOrgs || 0, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 mt-1">Monitor system health and verify new organizations.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="p-6 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Analytics & Predictive Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Donation Volume Trends</h2>
              <p className="text-sm text-gray-500">Trailing 7-day donation submissions</p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <DonationTrendChart data={trends} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">ML Demand Forecast</h2>
            <p className="text-sm text-gray-500">Predicted hotspots based on recipient requirements vs available supply</p>
          </div>
          <div className="h-48 mb-4">
            <DemandPieChart data={forecast} />
          </div>
          <div className="space-y-3">
            {forecast.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{f.food_category.replace(/_/g, ' ')}</span>
                <Badge variant={f.demand_score > 10 ? 'danger' : f.demand_score > 5 ? 'warning' : 'info'}>
                  Score: {Math.round(f.demand_score * 10) / 10}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Verification Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Verification Queue</h2>
          <Badge variant="warning" className="text-xs">
            {pendingOrgs.length} Pending
          </Badge>
        </div>

        {pendingOrgs.length === 0 ? (
          <EmptyState 
            icon={<ShieldCheck className="w-8 h-8 text-gray-400" />}
            title="All caught up!"
            description="There are no pending organizations waiting for verification."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[hsl(220,14%,96%)] border-b border-gray-100 text-sm font-semibold text-gray-600">
                    <th className="py-3 px-6 whitespace-nowrap">Organization</th>
                    <th className="py-3 px-6 whitespace-nowrap">Type / Reg. No</th>
                    <th className="py-3 px-6 whitespace-nowrap">Location</th>
                    <th className="py-3 px-6 whitespace-nowrap">Contact</th>
                    <th className="py-3 px-6 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{org.organization_name}</p>
                        <p className="text-xs text-gray-500">Submitted {new Date(org.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="default" className="mb-1">{org.organization_type.replace(/_/g, ' ')}</Badge>
                        <p className="text-xs text-gray-500">{org.registration_number || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-900">{org.city}, {org.state}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{org.address}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-900">{org.owner?.full_name}</p>
                        <p className="text-xs text-gray-500">{org.contact_phone || org.owner?.phone || 'No phone'}</p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleUpdateStatus(org.id, 'REJECTED')}
                            isLoading={updatingId === org.id}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleUpdateStatus(org.id, 'APPROVED')}
                            isLoading={updatingId === org.id}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
