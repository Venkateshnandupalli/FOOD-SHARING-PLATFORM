import React, { useEffect, useState } from 'react'
import { Star, Award, TrendingUp, MessageSquare } from 'lucide-react'
import { Card, Badge, EmptyState, Spinner, StatCard } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface Rating {
  id: string
  rating: number
  category: string
  comments: string | null
  created_at: string
  reviewer: { full_name: string } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  PICKUP_EXPERIENCE:  'Pickup Experience',
  DELIVERY_EXPERIENCE:'Delivery Experience',
  FOOD_QUALITY:       'Food Quality',
  QUANTITY_ACCURACY:  'Quantity Accuracy',
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

export default function VolunteerRatings() {
  const { profile } = useAuthStore()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile) return
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('ratings')
          .select(`
            id, rating, category, comments, created_at,
            reviewer:profiles!reviewer_id(full_name)
          `)
          .eq('reviewed_user_id', profile.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setRatings((data || []) as any)
      } catch {
        // graceful
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [profile])

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0

  // Category breakdown
  const categoryBreakdown = Object.entries(
    ratings.reduce((acc, r) => {
      acc[r.category] = acc[r.category] || { total: 0, count: 0 }
      acc[r.category].total += r.rating
      acc[r.category].count += 1
      return acc
    }, {} as Record<string, { total: number; count: number }>)
  ).map(([cat, { total, count }]) => ({
    category: cat,
    avg: total / count,
    count,
  }))

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
        <p className="text-gray-500 mt-1 text-sm">How donors and recipients have rated your work.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Overall Rating"
          value={ratings.length > 0 ? `${avgRating.toFixed(1)} / 5` : 'N/A'}
          icon={<Star className="w-5 h-5" />}
          color="orange"
          subtitle={`Based on ${ratings.length} review${ratings.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          title="Total Reviews"
          value={ratings.length}
          icon={<MessageSquare className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="5-Star Reviews"
          value={ratings.filter(r => r.rating === 5).length}
          icon={<Award className="w-5 h-5" />}
          color="green"
          subtitle={ratings.length > 0 ? `${Math.round(ratings.filter(r => r.rating === 5).length / ratings.length * 100)}% of total` : ''}
        />
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[hsl(142,71%,28%)]" />
            Category Breakdown
          </h2>
          <div className="space-y-4">
            {categoryBreakdown.map(({ category, avg, count }) => (
              <div key={category} className="flex items-center gap-4">
                <div className="w-40 shrink-0">
                  <p className="text-sm font-medium text-gray-700">{CATEGORY_LABELS[category] || category}</p>
                  <p className="text-xs text-gray-400">{count} rating{count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${(avg / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 w-10 text-right">{avg.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reviews List */}
      {ratings.length === 0 ? (
        <EmptyState
          icon={<Star className="w-8 h-8 text-gray-400" />}
          title="No Reviews Yet"
          description="Complete some deliveries and ask donors/recipients to rate your service!"
        />
      ) : (
        <div className="space-y-4">
          <h2 className="font-bold text-gray-900">All Reviews</h2>
          {ratings.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StarDisplay value={r.rating} />
                    <Badge variant="default" className="text-xs">
                      {CATEGORY_LABELS[r.category] || r.category}
                    </Badge>
                  </div>
                  {r.comments ? (
                    <p className="text-sm text-gray-700 leading-relaxed">"{r.comments}"</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No written review.</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    From {(r.reviewer as any)?.full_name || 'Anonymous'} • {formatDate(r.created_at, 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-amber-400">{r.rating}</p>
                  <p className="text-xs text-gray-400">/ 5</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
