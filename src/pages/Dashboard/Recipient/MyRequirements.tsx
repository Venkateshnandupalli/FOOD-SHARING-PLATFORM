import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Calendar, Package, AlertCircle } from 'lucide-react'
import { Button, Card, Input, Select, Textarea, Spinner, Badge } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { organizationService } from '@/services/organizationService'
import { requirementService, RecipientRequirement } from '@/services/requirementService'
import toast from 'react-hot-toast'

export default function MyRequirements() {
  const { profile } = useAuthStore()
  
  const [orgId, setOrgId] = useState<string | null>(null)
  const [requirements, setRequirements] = useState<RecipientRequirement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    food_category: 'COOKED_MEALS',
    dietary_type: 'MIXED',
    required_servings: '',
    required_before: '',
    delivery_preference: 'EITHER',
    priority: '3',
    notes: ''
  })

  useEffect(() => {
    async function loadData() {
      if (!profile) return
      try {
        const org = await organizationService.getOrganizationByOwnerId(profile.id)
        if (!org) {
          toast.error("You need an organization profile to manage requirements.")
          setIsLoading(false)
          return
        }
        setOrgId(org.id)
        
        const data = await requirementService.getRequirements(org.id)
        setRequirements(data)
      } catch (err: any) {
        toast.error("Failed to load requirements: " + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) return

    setIsSubmitting(true)
    try {
      const payload: RecipientRequirement = {
        recipient_organization_id: orgId,
        food_category: formData.food_category,
        dietary_type: formData.dietary_type,
        required_servings: parseInt(formData.required_servings, 10),
        required_before: new Date(formData.required_before).toISOString(),
        delivery_preference: formData.delivery_preference as any,
        priority: parseInt(formData.priority, 10),
        notes: formData.notes || null,
        status: 'OPEN'
      }

      const newReq = await requirementService.createRequirement(payload)
      setRequirements(prev => [newReq, ...prev])
      toast.success('Requirement published successfully!')
      
      // Reset form
      setFormData({
        food_category: 'COOKED_MEALS',
        dietary_type: 'MIXED',
        required_servings: '',
        required_before: '',
        delivery_preference: 'EITHER',
        priority: '3',
        notes: ''
      })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return
    try {
      await requirementService.deleteRequirement(id)
      setRequirements(prev => prev.filter(r => r.id !== id))
      toast.success('Requirement deleted')
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Food Requirements</h1>
        <p className="text-gray-500 mt-1">Publish your organization's food needs so donors can find you.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Col: Create Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">New Requirement</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Select
                label="Food Category *"
                name="food_category"
                value={formData.food_category}
                onChange={handleChange}
                options={[
                  { value: 'COOKED_MEALS', label: 'Cooked Meals' },
                  { value: 'BAKERY', label: 'Bakery & Pastries' },
                  { value: 'FRUITS_VEGETABLES', label: 'Fresh Produce' },
                  { value: 'PACKAGED_FOOD', label: 'Packaged Food' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Servings *"
                  name="required_servings"
                  type="number"
                  min="1"
                  value={formData.required_servings}
                  onChange={handleChange}
                  placeholder="e.g. 50"
                  required
                />
                <Select
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  options={[
                    { value: '1', label: '1 - Low' },
                    { value: '3', label: '3 - Normal' },
                    { value: '5', label: '5 - High/Urgent' },
                  ]}
                />
              </div>

              <Select
                label="Dietary Type *"
                name="dietary_type"
                value={formData.dietary_type}
                onChange={handleChange}
                options={[
                  { value: 'VEGETARIAN', label: 'Vegetarian' },
                  { value: 'NON_VEGETARIAN', label: 'Non-Vegetarian' },
                  { value: 'VEGAN', label: 'Vegan' },
                  { value: 'MIXED', label: 'Mixed' },
                ]}
              />

              <Input
                label="Required By (Time) *"
                name="required_before"
                type="datetime-local"
                value={formData.required_before}
                onChange={handleChange}
                required
              />

              <Select
                label="Delivery Preference *"
                name="delivery_preference"
                value={formData.delivery_preference}
                onChange={handleChange}
                options={[
                  { value: 'EITHER', label: 'Either (Delivery or Pickup)' },
                  { value: 'DELIVERY', label: 'Require Delivery' },
                  { value: 'SELF_PICKUP', label: 'Can Pickup' },
                ]}
              />

              <Textarea
                label="Additional Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Specific requests, packaging needs..."
                rows={2}
              />

              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
                Publish Requirement
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Col: List of requirements */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Active & Recent Requirements</h2>
          
          {requirements.length === 0 ? (
            <Card className="p-10 text-center flex flex-col items-center">
              <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="text-gray-900 font-semibold mb-1">No requirements published</h3>
              <p className="text-gray-500 text-sm">Publish your first requirement using the form to notify nearby donors.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requirements.map(req => (
                <Card key={req.id} className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={req.status === 'OPEN' ? 'success' : 'default'}>
                        {req.status}
                      </Badge>
                      {req.priority === 5 && (
                        <Badge variant="warning" className="bg-red-100 text-red-700">Urgent</Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900">
                      {req.required_servings} Servings of {req.food_category.replace(/_/g, ' ')}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        {req.dietary_type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Needed by: {new Date(req.required_before).toLocaleString()}
                      </div>
                    </div>
                    
                    {req.notes && (
                      <p className="text-sm text-gray-500 italic">"{req.notes}"</p>
                    )}
                  </div>
                  
                  {req.status === 'OPEN' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => req.id && handleDelete(req.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
