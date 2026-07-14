import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { DemandForecast } from '@/services/analyticsService'

interface DemandPieChartProps {
  data: DemandForecast[]
}

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F43F5E', '#EAB308']

export function DemandPieChart({ data }: DemandPieChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-400 text-sm flex items-center justify-center h-full">No forecast data available</div>
  }

  // Format data for PieChart (we use total_requested for sizes, or demand_score)
  const chartData = data.map((d, index) => ({
    name: d.food_category.replace(/_/g, ' '),
    value: Math.round(d.demand_score * 10) / 10, // Round to 1 decimal
    color: COLORS[index % COLORS.length]
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`${value} (Score)`, 'Demand Score']}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  )
}
