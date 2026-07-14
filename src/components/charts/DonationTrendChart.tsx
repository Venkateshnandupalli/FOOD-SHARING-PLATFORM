import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { TrendData } from '@/services/analyticsService'

interface DonationTrendChartProps {
  data: TrendData[]
}

export function DonationTrendChart({ data }: DonationTrendChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-400 text-sm flex items-center justify-center h-full">No trend data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220, 13%, 91%)" />
        <XAxis 
          dataKey="date" 
          tickLine={false} 
          axisLine={false} 
          tick={{ fontSize: 12, fill: 'hsl(220, 10%, 52%)' }} 
          dy={10}
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tick={{ fontSize: 12, fill: 'hsl(220, 10%, 52%)' }} 
          dx={-10}
          allowDecimals={false}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
        />
        <Area 
          type="monotone" 
          dataKey="donations" 
          stroke="hsl(142, 71%, 45%)" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorDonations)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
