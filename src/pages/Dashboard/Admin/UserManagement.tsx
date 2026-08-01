import React, { useEffect, useState } from 'react'
import { Users, Search, Shield, UserX, UserCheck } from 'lucide-react'
import { Badge, Button, EmptyState, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const ROLE_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default' | 'purple'> = {
  DONOR: 'success', RECIPIENT: 'warning', VOLUNTEER: 'info',
  ADMIN: 'purple', ANALYST: 'default',
}

export default function UserManagement() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(300)

      if (error) throw error
      setProfiles(data || [])
    } catch (err: any) {
      toast.error('Failed to load users: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggleActive = async (profileId: string, currentActive: boolean) => {
    setTogglingId(profileId)
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ is_active: !currentActive })
        .eq('id', profileId)
      if (error) throw error
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_active: !currentActive } : p))
      toast.success(currentActive ? 'User suspended' : 'User reactivated')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const ROLES = ['ALL', 'DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN', 'ANALYST']

  const filtered = profiles.filter(p => {
    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter
    const matchesSearch = !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
    return matchesRole && matchesSearch
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1 text-sm">{profiles.length} registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-11 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[hsl(270,60%,38%)] focus:ring-4 focus:ring-[hsla(270,60%,38%,0.1)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? 'bg-[hsl(270,60%,38%)] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-gray-400" />}
          title="No Users Found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">User</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Phone</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Role</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Joined</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.is_active ? 'opacity-60' : ''}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(270,60%,38%)] to-[hsl(270,60%,55%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {p.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{p.full_name}</p>
                          <p className="text-xs text-gray-400">{p.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{p.phone || '—'}</td>
                    <td className="py-4 px-6">
                      <Badge variant={ROLE_VARIANT[p.role] ?? 'default'}>{p.role}</Badge>
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(p.created_at, 'dd MMM yyyy')}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={p.is_active ? 'success' : 'danger'}>
                        {p.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {p.role !== 'ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={p.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => handleToggleActive(p.id, p.is_active)}
                          isLoading={togglingId === p.id}
                        >
                          {p.is_active
                            ? <><UserX className="w-3.5 h-3.5 mr-1" /> Suspend</>
                            : <><UserCheck className="w-3.5 h-3.5 mr-1" /> Reactivate</>
                          }
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {profiles.length} users
          </div>
        </div>
      )}
    </div>
  )
}
