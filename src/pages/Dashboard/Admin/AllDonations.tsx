import React, { useEffect, useState } from 'react'
import { Package, Search, Filter } from 'lucide-react'
import { Badge, Button, EmptyState, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate, urgencyLabel } from '@/lib/utils'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default' | 'purple'> = {
  DRAFT: 'default', AVAILABLE: 'info', MATCHED: 'purple', ACCEPTED: 'success',
  PICKUP_ASSIGNED: 'warning', COLLECTED: 'warning', DELIVERED: 'success',
  EXPIRED: 'danger', CANCELLED: 'danger', REJECTED: 'danger',
}

const ALL_STATUSES = ['ALL', 'AVAILABLE', 'MATCHED', 'ACCEPTED', 'DELIVERED', 'EXPIRED', 'CANCELLED']

export default function AllDonations() {
  const [donations, setDonations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('donations')
          .select(`
            id, title, food_category, quantity, quantity_unit, status,
            use_before, created_at,
            donor:profiles!donor_id(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(200)

        if (error) throw error
        setDonations(data || [])
      } catch {
        // graceful
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filtered = donations.filter(d => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
    const matchesSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.donor as any)?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Donations</h1>
        <p className="text-gray-500 mt-1 text-sm">{donations.length} total donations on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or donor name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-11 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[hsl(270,60%,38%)] focus:ring-4 focus:ring-[hsla(270,60%,38%,0.1)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-[hsl(270,60%,38%)] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-gray-400" />}
          title="No Donations Found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Donation</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Donor</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Quantity</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Expiry</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Created</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((d) => {
                  const urgency = urgencyLabel(d.use_before)
                  const statusV = STATUS_VARIANT[d.status] ?? 'default'
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{d.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{(d.food_category || '').replace(/_/g, ' ')}</p>
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {(d.donor as any)?.full_name || 'Unknown'}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {d.quantity} {d.quantity_unit}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-semibold" style={{ color: urgency.color }}>
                          {urgency.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(d.created_at, 'dd MMM yyyy')}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={statusV}>{d.status.replace(/_/g, ' ')}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {donations.length} donations
          </div>
        </div>
      )}
    </div>
  )
}
