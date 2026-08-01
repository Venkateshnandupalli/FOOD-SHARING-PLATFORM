import React, { useState, useEffect } from 'react'
import { Brain, TrendingUp, AlertTriangle, CloudRain, ShieldCheck, Zap } from 'lucide-react'
import { Card, Badge, Button, ProgressBar } from '@/components/ui'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts'
import { format, addDays } from 'date-fns'

const DEMAND_FORECAST = Array.from({ length: 7 }).map((_, i) => ({
  date: format(addDays(new Date(), i), 'MMM d'),
  predicted_demand: Math.floor(Math.random() * 500) + 200,
  confidence: Math.floor(Math.random() * 20) + 75
}))

const ALGORITHM_PERFORMANCE = [
  { metric: 'Proximity', value: 92 },
  { metric: 'Dietary Match', value: 85 },
  { metric: 'Capacity', value: 78 },
  { metric: 'Urgency', value: 95 },
  { metric: 'History', value: 65 },
]

export default function MLInsights() {
  const [isSimulating, setIsSimulating] = useState(false)

  // Simulate a model re-train
  const handleRetrain = () => {
    setIsSimulating(true)
    setTimeout(() => {
      setIsSimulating(false)
      import('react-hot-toast').then(m => m.default.success('ML Model retrained successfully!'))
    }, 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" /> ML Insights
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Predictive analytics and matching engine performance.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetrain} 
          isLoading={isSimulating}
        >
          <Zap className="w-4 h-4 mr-2" /> Retrain Model
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand Forecasting */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> 7-Day Demand Forecast
              </h2>
              <p className="text-xs text-gray-500 mt-1">Predicted food insecurity requests based on historical trends.</p>
            </div>
            <Badge variant="purple" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              Avg 85% Confidence
            </Badge>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEMAND_FORECAST} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any, name: any) => [val, name === 'predicted_demand' ? 'Predicted Meals' : 'Confidence %']}
                />
                <Area type="monotone" dataKey="predicted_demand" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDemand)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Algorithm Performance Radar */}
        <Card className="p-6">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Match Engine Weights
          </h2>
          <p className="text-xs text-gray-500 mb-4">Current prioritization of the matching algorithm.</p>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={ALGORITHM_PERFORMANCE}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#4b5563', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Weight" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Spoilage Risk Predictor */}
      <Card className="p-6">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-orange-500" /> Spoilage Risk Predictor
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl border border-red-100 bg-red-50/50">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-gray-900">Cooked Meals</span>
              <Badge variant="danger">High Risk</Badge>
            </div>
            <p className="text-xs text-gray-600 mb-3">High probability of spoilage due to current ambient temperatures.</p>
            <ProgressBar value={85} color="orange" height="sm" />
          </div>

          <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/50">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-gray-900">Dairy Products</span>
              <Badge variant="warning">Medium Risk</Badge>
            </div>
            <p className="text-xs text-gray-600 mb-3">Moderate risk without cold chain transport assigned.</p>
            <ProgressBar value={45} color="orange" height="sm" />
          </div>

          <div className="p-4 rounded-xl border border-green-100 bg-green-50/50">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-gray-900">Packaged Goods</span>
              <Badge variant="success">Low Risk</Badge>
            </div>
            <p className="text-xs text-gray-600 mb-3">Very low risk. Extended shelf life detected.</p>
            <ProgressBar value={10} color="green" height="sm" />
          </div>
        </div>
      </Card>
    </div>
  )
}
