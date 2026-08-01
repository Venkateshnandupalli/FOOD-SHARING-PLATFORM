import React, { useEffect, useState } from 'react'
import {
  Building2, MapPin, Phone, Globe, FileText, Clock, CheckCircle,
  XCircle, Edit3, Save, X, AlertCircle
} from 'lucide-react'
import { Card, Badge, Button, Input, Spinner, EmptyState } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { organizationService } from '@/services/organizationService'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const ORG_TYPE_LABELS: Record<string, string> = {
  NGO: 'NGO',
  FOOD_BANK: 'Food Bank',
  ORPHANAGE: 'Orphanage',
  SHELTER: 'Shelter',
  COMMUNITY_KITCHEN: 'Community Kitchen',
  RELIEF_ORGANISATION: 'Relief Organisation',
  OTHER: 'Other',
}

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending Review', variant: 'warning' as const,  icon: Clock },
  APPROVED:  { label: 'Verified',       variant: 'success' as const,  icon: CheckCircle },
  REJECTED:  { label: 'Rejected',       variant: 'danger' as const,   icon: XCircle },
  SUSPENDED: { label: 'Suspended',      variant: 'danger' as const,   icon: AlertCircle },
}

export default function OrganisationProfile() {
  const { profile } = useAuthStore()
  const [org, setOrg] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    contact_phone: '',
    website_url: '',
    description: '',
  })

  const load = async () => {
    if (!profile) return
    setIsLoading(true)
    try {
      const data = await organizationService.getOrganizationByOwnerId(profile.id)
      setOrg(data)
      if (data) {
        setFormData({
          contact_phone: data.contact_phone || '',
          website_url: data.website_url || '',
          description: data.description || '',
        })
      }
    } catch (err: any) {
      toast.error('Failed to load organisation: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [profile])

  const handleSave = async () => {
    if (!org) return
    setIsSaving(true)
    try {
      const { error } = await (supabase as any)
        .from('organizations')
        .update(formData)
        .eq('id', org.id)
      if (error) throw error
      toast.success('Organisation updated successfully!')
      setIsEditing(false)
      await load()
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!org) {
    return (
      <EmptyState
        icon={<Building2 className="w-8 h-8 text-gray-400" />}
        title="No Organisation Found"
        description="You haven't registered an organisation yet. Please complete the onboarding process first."
      />
    )
  }

  const statusCfg = STATUS_CONFIG[org.verification_status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING
  const StatusIcon = statusCfg.icon

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organisation Profile</h1>
          <p className="text-gray-500 mt-1 text-sm">View and manage your organisation details.</p>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        )}
      </div>

      {/* Verification Status Banner */}
      <div className={`flex items-center gap-4 p-4 rounded-2xl border ${
        org.verification_status === 'APPROVED'
          ? 'bg-emerald-50 border-emerald-200'
          : org.verification_status === 'PENDING'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <StatusIcon className={`w-6 h-6 shrink-0 ${
          org.verification_status === 'APPROVED' ? 'text-emerald-600'
          : org.verification_status === 'PENDING' ? 'text-amber-600' : 'text-red-600'
        }`} />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{statusCfg.label}</p>
          <p className="text-sm text-gray-600 mt-0.5">
            {org.verification_status === 'APPROVED' && 'Your organisation is verified and can receive donations.'}
            {org.verification_status === 'PENDING' && 'Your organisation is under review. You will be notified once approved.'}
            {org.verification_status === 'REJECTED' && 'Your application was rejected. Please contact support for details.'}
            {org.verification_status === 'SUSPENDED' && 'Your organisation has been suspended. Please contact support.'}
          </p>
        </div>
        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
      </div>

      {/* Main Info Card */}
      <Card className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(142,60%,94%)] flex items-center justify-center">
            <Building2 className="w-7 h-7 text-[hsl(142,71%,28%)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{org.organization_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="info">{ORG_TYPE_LABELS[org.organization_type] || org.organization_type}</Badge>
              {org.registration_number && (
                <span className="text-xs text-gray-500">Reg: {org.registration_number}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
              <p className="text-sm text-gray-900">{org.address}</p>
              <p className="text-sm text-gray-600">{org.city}, {org.state} {org.postal_code || ''}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Capacity</p>
              <p className="text-sm text-gray-900">
                {org.storage_capacity ? `${org.storage_capacity} meals` : 'Not specified'}
              </p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Phone</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={e => setFormData(p => ({ ...p, contact_phone: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[hsl(142,71%,28%)]"
                />
              ) : (
                <p className="text-sm text-gray-900">{org.contact_phone || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Website</p>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={e => setFormData(p => ({ ...p, website_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[hsl(142,71%,28%)]"
                />
              ) : org.website_url ? (
                <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[hsl(142,71%,28%)] hover:underline break-all">
                  {org.website_url}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
          {isEditing ? (
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={4}
              placeholder="Tell donors about your organisation..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-y focus:outline-none focus:border-[hsl(142,71%,28%)]"
            />
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">
              {org.description || <span className="text-gray-400 italic">No description provided.</span>}
            </p>
          )}
        </div>

        {/* Meta info */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          <span>Created {formatDate(org.created_at, 'dd MMM yyyy')}</span>
          {org.updated_at && <span>Last updated {formatDate(org.updated_at, 'dd MMM yyyy')}</span>}
        </div>
      </Card>
    </div>
  )
}
