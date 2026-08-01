import React, { useEffect, useState } from 'react'
import { ShieldCheck, CheckCircle, XCircle, Eye, Building2, Phone, MapPin, FileText, Calendar } from 'lucide-react'
import { Card, Badge, Button, EmptyState, Spinner } from '@/components/ui'
import { adminService } from '@/services/adminService'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const ORG_TYPE_LABELS: Record<string, string> = {
  NGO: 'NGO', FOOD_BANK: 'Food Bank', ORPHANAGE: 'Orphanage',
  SHELTER: 'Shelter', COMMUNITY_KITCHEN: 'Community Kitchen',
  RELIEF_ORGANISATION: 'Relief Organisation', OTHER: 'Other',
}

export default function Verifications() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getPendingOrganizations()
      setOrgs(data || [])
    } catch (err: any) {
      toast.error('Failed to load verification queue: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAction = async (orgId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(orgId)
    try {
      await adminService.updateOrganizationStatus(orgId, status)
      toast.success(`Organisation ${status.toLowerCase()} successfully!`)
      setExpandedId(null)
      await load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {orgs.length} organisation{orgs.length !== 1 ? 's' : ''} pending review
          </p>
        </div>
        <Badge variant="warning" className="text-sm px-3 py-1.5">
          {orgs.length} Pending
        </Badge>
      </div>

      {orgs.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 text-gray-400" />}
          title="All Clear!"
          description="There are no organisations pending verification at this time."
        />
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <Card key={org.id} className="overflow-hidden">
              {/* Main Row */}
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{org.organization_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="info">{ORG_TYPE_LABELS[org.organization_type] || org.organization_type}</Badge>
                        {org.registration_number && (
                          <span className="text-xs text-gray-500">Reg: {org.registration_number}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{org.city}, {org.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDate(org.created_at, 'dd MMM yyyy')}</span>
                    </div>
                    {(org.contact_phone || org.owner?.phone) && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{org.contact_phone || org.owner?.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === org.id ? null : org.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {expandedId === org.id ? 'Less' : 'Details'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => handleAction(org.id, 'REJECTED')}
                      isLoading={updatingId === org.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAction(org.id, 'APPROVED')}
                      isLoading={updatingId === org.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === org.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Contact Person</p>
                      <p className="font-medium text-gray-900">{org.owner?.full_name || 'N/A'}</p>
                      <p className="text-gray-500">{org.owner?.phone || 'No phone'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Full Address</p>
                      <p className="font-medium text-gray-900">{org.address}</p>
                      <p className="text-gray-500">{org.postal_code}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Storage Capacity</p>
                      <p className="font-medium text-gray-900">
                        {org.storage_capacity ? `${org.storage_capacity} meals` : 'Not specified'}
                      </p>
                    </div>
                    {org.website_url && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Website</p>
                        <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                          className="text-[hsl(270,60%,38%)] hover:underline break-all text-sm">
                          {org.website_url}
                        </a>
                      </div>
                    )}
                    {org.description && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Description</p>
                        <p className="text-gray-700 leading-relaxed">{org.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
