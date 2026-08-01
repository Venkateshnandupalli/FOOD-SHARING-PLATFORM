import React, { useEffect, useState } from 'react'
import {
  Users, Package, Truck, Building2, TrendingUp, CheckCircle,
  XCircle, Activity, RefreshCw
} from 'lucide-react'
import { Card, StatCard, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, subDays } from 'date-fns'

const CHART_COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

export default function PlatformAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    totalDeliveries: 0,
    totalOrgs: 0,
    deliveredCount: 0,
    failedCount: 0,
    expiredDonations: 0,
  })
  const [dailyDonations, setDailyDonations] = useState<{ date: string; count: number }[]>([])
  const [dailyDeliveries, setDailyDeliveries] = useState<{ date: string; count: number }[]>([])
  const [roleBreakdown, setRoleBreakdown] = useState<{ name: string; value: number }[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; value: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = async () => {
    setIsLoading(true)
    try {
      // Parallel fetch all stats
      const [
        { count: totalUsers },
        { count: totalDonations },
        { count: totalDeliveries },
        { count: totalOrgs },
        { count: deliveredCount },
        { count: failedCount },
        { count: expiredDonations },
        { data: recentDonations },
        { data: recentDeliveries },
        { data: profiles },
        { data: categories },
      ] = await Promise.all([
        (supabase as any).from('profiles').select('*', { count: 'exact', head: true }),
        (supabase as any).from('donations').select('*', { count: 'exact', head: true }),
        (supabase as any).from('deliveries').select('*', { count: 'exact', head: true }),
        (supabase as any).from('organizations').select('*', { count: 'exact', head: true }).eq('verification_status', 'APPROVED'),
        (supabase as any).from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'DELIVERED'),
        (supabase as any).from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'FAILED'),
        (supabase as any).from('donations').select('*', { count: 'exact', head: true }).eq('status', 'EXPIRED'),
        (supabase as any).from('donations').select('created_at').gte('created_at', subDays(new Date(), 14).toISOString()).order('created_at'),
        (supabase as any).from('deliveries').select('created_at').gte('created_at', subDays(new Date(), 14).toISOString()).order('created_at'),
        (supabase as any).from('profiles').select('role'),
        (supabase as any).from('donations').select('food_category').not('food_category', 'is', null),
      ])

      setStats({
        totalUsers: totalUsers || 0,
        totalDonations: totalDonations || 0,
        totalDeliveries: totalDeliveries || 0,
        totalOrgs: totalOrgs || 0,
        deliveredCount: deliveredCount || 0,
        failedCount: failedCount || 0,
        expiredDonations: expiredDonations || 0,
      })

      // Build daily donation trend (last 14 days)
      const donByDay: Record<string, number> = {}
      ;(recentDonations as any[] || []).forEach((d: any) => {
        const day = format(new Date(d.created_at), 'MMM d')
        donByDay[day] = (donByDay[day] || 0) + 1
      })
      const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = format(subDays(new Date(), 13 - i), 'MMM d')
        return { date: d, count: donByDay[d] || 0 }
      })
      setDailyDonations(last14)

      // Build daily delivery trend (last 14 days)
      const delByDay: Record<string, number> = {}
      ;(recentDeliveries as any[] || []).forEach((d: any) => {
        const day = format(new Date(d.created_at), 'MMM d')
        delByDay[day] = (delByDay[day] || 0) + 1
      })
      const last14Del = Array.from({ length: 14 }, (_, i) => {
        const d = format(subDays(new Date(), 13 - i), 'MMM d')
        return { date: d, count: delByDay[d] || 0 }
      })
      setDailyDeliveries(last14Del)

      // Role breakdown pie
      const roleMap: Record<string, number> = {}
      ;(profiles as any[] || []).forEach((p: any) => {
        roleMap[p.role] = (roleMap[p.role] || 0) + 1
      })
      setRoleBreakdown(Object.entries(roleMap).map(([name, value]) => ({ name, value })))

      // Category breakdown
      const catMap: Record<string, number> = {}
      ;(categories as any[] || []).forEach((d: any) => {
        const k = (d.food_category || '').replace(/_/g, ' ')
        catMap[k] = (catMap[k] || 0) + 1
      })
      setCategoryBreakdown(
        Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name, value }))
      )
    } catch {
      // graceful
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const deliverySuccessRate = stats.totalDeliveries
    ? Math.round((stats.deliveredCount / stats.totalDeliveries) * 100)
    : 0

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-500 mt-1 text-sm">Real-time data across all platform entities.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-xl hover:border-gray-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatCard title="Total Donations" value={stats.totalDonations} icon={<Package className="w-5 h-5" />} color="green" />
        <StatCard title="Total Deliveries" value={stats.totalDeliveries} icon={<Truck className="w-5 h-5" />} color="orange" />
        <StatCard title="Verified Orgs" value={stats.totalOrgs} icon={<Building2 className="w-5 h-5" />} color="purple" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{deliverySuccessRate}%</p>
            <p className="text-sm text-gray-500">Delivery Success Rate</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-400">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.expiredDonations}</p>
            <p className="text-sm text-gray-500">Expired Donations</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-orange-400">
          <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.failedCount}</p>
            <p className="text-sm text-gray-500">Failed Deliveries</p>
          </div>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-1">Donation Volume (14 Days)</h2>
          <p className="text-sm text-gray-500 mb-5">New donation submissions per day</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyDonations}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} interval={1} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={3} dot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }} activeDot={{ r: 5 }} name="Donations" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-1">Delivery Volume (14 Days)</h2>
          <p className="text-sm text-gray-500 mb-5">Delivery attempts per day</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyDeliveries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} interval={1} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Deliveries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-4">User Role Distribution</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {roleBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Food Categories</h2>
          <div className="space-y-3 mt-2">
            {categoryBreakdown.map(({ name, value }, i) => {
              const total = categoryBreakdown.reduce((s, c) => s + c.value, 0)
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="flex-1 text-sm text-gray-700 font-medium capitalize truncate">{name.toLowerCase()}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-10 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
