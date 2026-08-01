import React, { useState } from 'react'
import { Download, FileText, Package, Users, Building2, Truck, Calendar, CheckCircle } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { format, subDays } from 'date-fns'
import toast from 'react-hot-toast'

type ExportEntity = 'donations' | 'deliveries' | 'organizations' | 'users'

interface ExportConfig {
  entity: ExportEntity
  label: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  fields: string[]
}

const EXPORTS: ExportConfig[] = [
  {
    entity: 'donations',
    label: 'Donations',
    description: 'All donation records including status, quantity, food category and expiry.',
    icon: Package,
    color: 'text-green-600',
    bg: 'bg-green-50',
    fields: ['id', 'title', 'food_category', 'quantity', 'quantity_unit', 'status', 'use_before', 'created_at'],
  },
  {
    entity: 'deliveries',
    label: 'Deliveries',
    description: 'Delivery attempts with status, timestamps and volunteer info.',
    icon: Truck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    fields: ['id', 'status', 'created_at', 'updated_at'],
  },
  {
    entity: 'organizations',
    label: 'Organizations',
    description: 'Verified recipient organizations with location and capacity data.',
    icon: Building2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    fields: ['id', 'organization_name', 'organization_type', 'city', 'state', 'verification_status', 'created_at'],
  },
  {
    entity: 'users',
    label: 'Users',
    description: 'Platform user accounts with role and join date.',
    icon: Users,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    fields: ['id', 'full_name', 'role', 'is_active', 'created_at'],
  },
]

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: 0 },
]

function downloadCSV(data: any[], filename: string) {
  if (!data.length) {
    toast.error('No data to export for this range.')
    return
  }
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      const s = String(val).replace(/"/g, '""')
      return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s
    }).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function DataExport() {
  const [datePreset, setDatePreset] = useState(30)
  const [exporting, setExporting] = useState<ExportEntity | null>(null)
  const [exported, setExported] = useState<Set<ExportEntity>>(new Set())

  const handleExport = async (cfg: ExportConfig) => {
    setExporting(cfg.entity)
    try {
      const since = datePreset === 0
        ? null
        : subDays(new Date(), datePreset).toISOString()

      const tableName = cfg.entity === 'users' ? 'profiles' : cfg.entity
      let query = (supabase as any)
        .from(tableName)
        .select(cfg.fields.join(', '))
        .order('created_at', { ascending: false })
        .limit(5000)

      if (since) {
        query = query.gte('created_at', since)
      }

      const { data, error } = await query
      if (error) throw error

      const dateLabel = datePreset === 0 ? 'all' : `last${datePreset}d`
      downloadCSV(data || [], `shareplate_${cfg.entity}_${dateLabel}_${format(new Date(), 'yyyyMMdd')}.csv`)
      setExported(prev => new Set([...prev, cfg.entity]))
      toast.success(`${cfg.label} exported successfully — ${(data || []).length} rows`)
    } catch (err: any) {
      toast.error('Export failed: ' + err.message)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Export</h1>
        <p className="text-gray-500 mt-1 text-sm">Download platform data as CSV for offline analysis.</p>
      </div>

      {/* Date Range Selector */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h2 className="font-bold text-gray-900">Date Range</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map(p => (
            <button
              key={p.days}
              onClick={() => { setDatePreset(p.days); setExported(new Set()) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                datePreset === p.days
                  ? 'bg-[hsl(210,80%,38%)] text-white shadow-sm shadow-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {datePreset === 0
            ? 'Exporting all records (may be slow for large datasets)'
            : `Exporting records from the last ${datePreset} days`}
        </p>
      </Card>

      {/* Export Cards */}
      <div className="space-y-4">
        {EXPORTS.map(cfg => {
          const Icon = cfg.icon
          const isExported = exported.has(cfg.entity)
          const isExporting = exporting === cfg.entity

          return (
            <Card key={cfg.entity} className={`p-5 flex items-center gap-5 transition-all ${isExported ? 'border-green-200 bg-green-50/30' : 'hover:border-gray-300'}`}>
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                <Icon className={`w-6 h-6 ${cfg.color}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{cfg.label}</h3>
                  {isExported && (
                    <Badge variant="success" className="text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Exported
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">{cfg.description}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  Fields: <span className="font-mono">{cfg.fields.join(', ')}</span>
                </p>
              </div>

              {/* Export Button */}
              <Button
                variant={isExported ? 'outline' : 'primary'}
                size="sm"
                onClick={() => handleExport(cfg)}
                isLoading={isExporting}
                className="shrink-0"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExported ? 'Re-export' : 'Export CSV'}
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <FileText className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Export Guidelines</p>
          <ul className="text-sm text-blue-700 mt-1 space-y-1 list-disc list-inside">
            <li>All exports are UTF-8 encoded CSV files</li>
            <li>Sensitive fields like passwords and tokens are excluded</li>
            <li>Maximum 5,000 rows per export — narrow date range to get specific data</li>
            <li>Exports are for internal analysis only and must be handled securely</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
