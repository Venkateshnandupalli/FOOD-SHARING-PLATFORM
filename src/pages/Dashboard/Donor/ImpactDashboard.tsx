import React, { useEffect, useState } from 'react'
import { Heart, Droplets, Wind, TrendingUp } from 'lucide-react'
import { Card, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { impactService } from '@/services/impactService'
import type { ImpactData } from '@/services/impactService'
import toast from 'react-hot-toast'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#16a34a', '#2563eb', '#eab308', '#dc2626', '#9333ea', '#ea580c']

export default function ImpactDashboard() {
  const { profile } = useAuthStore()
  const [impact, setImpact] = useState<ImpactData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!profile) return
      try {
        const data = await impactService.getDonorImpact(profile.id)
        setImpact(data)
      } catch (err: any) {
        toast.error('Failed to load impact data: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [profile])

  if (isLoading || !impact) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Meals Provided', value: impact.totalMeals.toLocaleString(), icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'CO₂ Emissions Saved', value: `${impact.totalCo2SavedLbs.toLocaleString()} lbs`, icon: Wind, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Water Saved', value: `${impact.totalWaterSavedGallons.toLocaleString()} gal`, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Impact</h1>
        <p className="text-gray-500 mt-1">See the difference you're making in the world.</p>
      </div>

      {/* Hero Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="p-6 relative overflow-hidden group hover:border-[hsl(142,71%,28%)] transition-colors">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Donations Over Time</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={impact.donationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} meals`, 'Donated']}
                />
                <Line 
                  type="monotone" 
                  dataKey="meals" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#15803d' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Food Categories</h2>
          {impact.donationsByCategory.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={impact.donationsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {impact.donationsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`${value} meals`, 'Category']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {impact.donationsByCategory.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="capitalize">{entry.name.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
