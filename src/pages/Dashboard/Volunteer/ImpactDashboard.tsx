import React, { useEffect, useState } from 'react'
import { Heart, Wind, MapPin, TrendingUp, Truck } from 'lucide-react'
import { Card, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { impactService } from '@/services/impactService'
import type { VolunteerImpactData } from '@/services/impactService'
import toast from 'react-hot-toast'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

export default function VolunteerImpactDashboard() {
  const { profile } = useAuthStore()
  const [impact, setImpact] = useState<VolunteerImpactData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!profile) return
      try {
        const data = await impactService.getVolunteerImpact(profile.id)
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

  // 1 lb of food saved from landfill ≈ 3.8 lbs of CO2 eq prevented.
  // We estimate average meal weight at 1.2 lbs, so ~4.5 lbs CO2 saved per meal.
  const co2Saved = Math.round(impact.totalMealsDelivered * 4.5)

  // Trust Level gamification
  const totalDeliveries = impact.totalDeliveries
  const trustLevel =
    totalDeliveries >= 100 ? { label: 'Platinum', emoji: '💎', color: 'from-cyan-400 to-blue-500', min: 100, next: null } :
    totalDeliveries >= 50  ? { label: 'Gold',     emoji: '🥇', color: 'from-yellow-400 to-amber-500', min: 50, next: 100 } :
    totalDeliveries >= 20  ? { label: 'Silver',   emoji: '🥈', color: 'from-slate-300 to-slate-400',  min: 20, next: 50 } :
                             { label: 'Bronze',   emoji: '🥉', color: 'from-orange-400 to-amber-600',  min: 0,  next: 20 }

  const progressToNext = trustLevel.next
    ? Math.round(((totalDeliveries - trustLevel.min) / (trustLevel.next - trustLevel.min)) * 100)
    : 100

  const statCards = [
    { label: 'Deliveries Completed', value: impact.totalDeliveries, icon: Truck, color: 'text-[hsl(195,85%,41%)]', bg: 'bg-[hsl(195,85%,92%)]' },
    { label: 'Miles Driven', value: `${impact.totalDistanceKm} km`, icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Meals Transported', value: impact.totalMealsDelivered.toLocaleString(), icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'CO₂ Prevented', value: `${co2Saved.toLocaleString()} lbs`, icon: Wind, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Impact</h1>
        <p className="text-gray-500 mt-1">Track your contribution to reducing food waste and feeding the community.</p>
      </div>

      {/* ── Trust Level Banner ── */}
      <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r ${trustLevel.color} text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold opacity-80 uppercase tracking-widest mb-1">Volunteer Level</p>
            <h2 className="text-3xl font-black flex items-center gap-3">
              {trustLevel.emoji} {trustLevel.label}
            </h2>
            <p className="text-sm opacity-80 mt-1">
              {trustLevel.next
                ? `${totalDeliveries} deliveries • ${trustLevel.next - totalDeliveries} more to reach next level`
                : `${totalDeliveries} deliveries • Maximum level achieved! 🎉`}
            </p>
          </div>
          <div className="text-6xl opacity-20 font-black select-none">{trustLevel.emoji}</div>
        </div>
        {trustLevel.next && (
          <div className="mt-4">
            <div className="flex justify-between text-xs opacity-70 mb-1.5">
              <span>{trustLevel.label}</span>
              <span>
                {trustLevel.next === 20 ? 'Silver' :
                 trustLevel.next === 50 ? 'Gold' :
                 trustLevel.next === 100 ? 'Platinum' : ''}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all duration-700"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <p className="text-xs opacity-70 mt-1">{progressToNext}% to next level</p>
          </div>
        )}
      </div>

      {/* Hero Impact Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="p-6 relative overflow-hidden group hover:border-[hsl(195,85%,41%)] transition-colors">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative z-10 flex flex-col gap-3">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} self-start`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliveries Over Time Line Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Deliveries Over Time</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={impact.deliveriesByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} deliveries`, 'Completed']}
                />
                <Line 
                  type="monotone" 
                  dataKey="deliveries" 
                  stroke="hsl(195,85%,41%)" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(195,85%,41%)', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'hsl(195,85%,30%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distance Over Time Bar Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Distance Traveled (km)</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={impact.deliveriesByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                  formatter={(value: any) => [`${value} km`, 'Distance']}
                />
                <Bar dataKey="distance" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
