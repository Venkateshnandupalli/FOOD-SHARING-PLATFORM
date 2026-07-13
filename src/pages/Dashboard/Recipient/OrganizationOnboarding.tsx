import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, CheckCircle, Upload } from 'lucide-react'
import { Button, Input, Card, Select } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { organizationService } from '@/services/organizationService'
import toast from 'react-hot-toast'

const ORG_TYPES = [
  { value: 'NGO', label: 'NGO' },
  { value: 'FOOD_BANK', label: 'Food Bank' },
  { value: 'SHELTER', label: 'Shelter' },
  { value: 'ORPHANAGE', label: 'Orphanage' },
  { value: 'COMMUNITY_KITCHEN', label: 'Community Kitchen' },
  { value: 'RELIEF_ORGANISATION', label: 'Relief Organisation' },
  { value: 'OTHER', label: 'Other' }
]

export default function OrganizationOnboarding() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'NGO',
    registration_number: '',
    address: '',
    city: '',
    state: 'Andhra Pradesh',
    postal_code: '',
    contact_phone: '',
    storage_capacity: 50,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsSubmitting(true)
    try {
      await organizationService.createOrganization({
        owner_id: profile.id,
        organization_name: formData.organization_name,
        organization_type: formData.organization_type as any,
        registration_number: formData.registration_number,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        contact_phone: formData.contact_phone,
        storage_capacity: Number(formData.storage_capacity),
        latitude: 17.3850, // Mock location for demo (Hyderabad)
        longitude: 78.4867,
        verification_status: 'PENDING'
      })
      toast.success('Organization profile created!')
      // Force reload to fetch the new organization in the dashboard
      window.location.href = '/recipient'
    } catch (err: any) {
      toast.error('Failed to create organization: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Register Your Organization</h1>
        <p className="text-gray-500 mt-2">Before you can accept food donations, we need some details about your facility.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Details</h3>
            
            <Input 
              label="Organization Name"
              name="organization_name"
              required
              value={formData.organization_name}
              onChange={handleChange}
              placeholder="e.g. Hope Foundation"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Organization Type"
                name="organization_type"
                required
                options={ORG_TYPES}
                value={formData.organization_type}
                onChange={handleChange}
              />
              <Input 
                label="Registration Number"
                name="registration_number"
                required
                value={formData.registration_number}
                onChange={handleChange}
                placeholder="Govt. Registration ID"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Location & Capacity</h3>
            
            <Input 
              label="Street Address"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
            
            <div className="grid grid-cols-3 gap-4">
              <Input 
                label="City"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
              />
              <Input 
                label="State"
                name="state"
                value={formData.state}
                disabled
              />
              <Input 
                label="PIN Code"
                name="postal_code"
                required
                value={formData.postal_code}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Contact Phone"
                name="contact_phone"
                required
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="+91..."
              />
              <Input 
                label="Storage Capacity (Meals)"
                type="number"
                name="storage_capacity"
                required
                value={formData.storage_capacity}
                onChange={handleChange}
                min="10"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={isSubmitting} leftIcon={<CheckCircle className="w-4 h-4" />}>
              Complete Registration
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
