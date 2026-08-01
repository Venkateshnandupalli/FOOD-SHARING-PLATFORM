import React, { useEffect, useState } from 'react'
import { Building2, Heart, TrendingUp, Users, Activity } from 'lucide-react'
import { Card, StatCard, Spinner, Badge } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ec4899', '#6366f1']

export default function RecipientAnalytics() {
  const [stats, setStats] = useState({
    totalRecipients: 0,
    totalMealsReceived: 0,
    activeRecipients: 0,
  })
  const [topRecipients, setTopRecipients] = useState<{ name: string; meals: number; type: string }[]>([])
  const [demandByCity, setDemandByCity] = useState<{ city: string; count: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Fetch all verified organizations
        const { data: orgs, error: orgsErr } = await (supabase as any)
          .from('organizations')
          .select('id, organization_name, organization_type, city')
          .eq('verification_status', 'APPROVED')

        if (orgsErr) throw orgsErr

        // Fetch completed deliveries for volume tracking
        const { data: deliveries, error: delErr } = await (supabase as any)
          .from('deliveries')
          .select('match:matches(recipient_id, donation:donations(estimated_servings))')
          .eq('status', 'DELIVERED')

        if (delErr) throw delErr

        // Compute metrics
        let totalMeals = 0
        const mealsByOrg: Record<string, number> = {}
        const activeOrgIds = new Set<string>()

        ;(deliveries as any[] || []).forEach(d => {
          const rId = d.match?.recipient_id
          const meals = Number(d.match?.donation?.estimated_servings) || 1
          if (rId) {
            totalMeals += meals
            mealsByOrg[rId] = (mealsByOrg[rId] || 0) + meals
            activeOrgIds.add(rId)
          }
        })

        // Map stats to organizations
        const mappedTop = (orgs as any[] || []).map(o => ({
          name: o.organization_name,
          type: o.organization_type,
          meals: mealsByOrg[o.id] || 0
        })).filter(o => o.meals > 0).sort((a, b) => b.meals - a.meals).slice(0, 5)

        // Compute demand by city
        const cityMap: Record<string, number> = {}
        ;(orgs as any[] || []).forEach(o => {
          const c = o.city || 'Unknown'
          cityMap[c] = (cityMap[c] || 0) + 1
        })
        const mappedCities = Object.entries(cityMap)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)

        setStats({
          totalRecipients: (orgs as any[] || []).length,
          totalMealsReceived: totalMeals,
          activeRecipients: activeOrgIds.size,
        })
        setTopRecipients(mappedTop)
        setDemandByCity(mappedCities)
      } catch (err: any) {
        toast.error('Failed to load analytics: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Spinner size="lg" /></div>
  }

  const engagementRate = stats.totalRecipients > 0 
    ? Math.round((stats.activeRecipients / stats.totalRecipients) * 100) 
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recipient Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Deep dive into organization demand, distribution, and capacity.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Verified Orgs" value={stats.totalRecipients} icon={<Building2 className="w-5 h-5" />} color="blue" />
        <StatCard title="Active Orgs" value={stats.activeRecipients} icon={<Activity className="w-5 h-5" />} color="green" />
        <StatCard title="Meals Distributed" value={stats.totalMealsReceived} icon={<Heart className="w-5 h-5" />} color="orange" />
        <StatCard title="Engagement Rate" value={`${engagementRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Recipients Chart */}
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <h2 className="font-bold text-gray-900">Top Recipient Organizations</h2>
          </div>
          <div className="h-72">
            {topRecipients.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRecipients} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} width={120} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f3f4f6' }}
                    formatter={(val: any) => [`${val.toLocaleString()} meals`, 'Received']}
                  />
                  <Bar dataKey="meals" radius={[0, 4, 4, 0]} barSize={24}>
                    {topRecipients.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">No data available yet</div>
            )}
          </div>
        </Card>

        {/* Demand by City List */}
        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-5">Concentration by City</h2>
          {demandByCity.length > 0 ? (
            <div className="space-y-4">
              {demandByCity.map((city, i) => {
                const max = Math.max(...demandByCity.map(c => c.count)) || 1
                const pct = Math.round((city.count / max) * 100)
                return (
                  <div key={city.city} className="flex items-center gap-4">
                    <span className="w-6 text-center font-bold text-gray-300 text-sm">#{i + 1}</span>
                    <span className="w-24 text-sm font-semibold text-gray-700 truncate">{city.city}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right text-sm font-bold text-gray-900">{city.count} <span className="font-normal text-xs text-gray-400">orgs</span></span>
                  </div>
                )
              })}
            </div>
          ) : (
             <div className="h-40 flex items-center justify-center text-sm text-gray-400">No data available yet</div>
          )}
        </Card>
      </div>
    </div>
  )
}
