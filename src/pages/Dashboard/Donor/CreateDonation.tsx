import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, ArrowRight, Package, Clock, MapPin, Camera, 
  CheckCircle, AlertTriangle, Info, UploadCloud
} from 'lucide-react'
import { Button, Card, Badge, Input, Select, Textarea } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { donationService } from '@/services/donationService'
import type { Database } from '@/types/database'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

type DonationInsert = Database['public']['Tables']['donations']['Insert']
type FoodCategory = Database['public']['Enums']['food_category']
type DietaryType = Database['public']['Enums']['dietary_type']
type StorageType = Database['public']['Enums']['storage_type']
type PackagingStatus = Database['public']['Enums']['packaging_status']

// ─── Map Click Handler Component ──────────────────────────────────────────────
function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })
  return <Marker position={position} />
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreateDonation() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    food_category: 'COOKED_MEALS' as FoodCategory,
    dietary_type: 'MIXED' as DietaryType,
    allergen_information: '',
    quantity: '',
    quantity_unit: 'servings',
    estimated_servings: '',
    prepared_at: '',
    use_before: '',
    storage_type: 'ROOM_TEMPERATURE' as StorageType,
    packaging_status: 'SEALED' as PackagingStatus,
    pickup_address: '',
    donor_notes: '',
    food_safety_acknowledged: false,
  })

  // Map state (Default to Kakinada roughly)
  const [mapCenter] = useState<[number, number]>([16.9891, 82.2475])
  const [pickupLocation, setPickupLocation] = useState<[number, number]>([16.9891, 82.2475])
  
  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleNext = () => {
    // Basic validation per step
    if (step === 1 && (!formData.title || !formData.food_category)) return
    if (step === 2 && (!formData.quantity || !formData.estimated_servings || !formData.prepared_at || !formData.use_before)) return
    if (step === 3 && (!formData.pickup_address)) return
    setStep(s => Math.min(4, s + 1))
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    setStep(s => Math.max(1, s - 1))
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) {
      import('react-hot-toast').then(m => m.default.error('User profile not found. Please log in again.'))
      return
    }
    if (!formData.food_safety_acknowledged) {
      setError('You must acknowledge food safety guidelines to proceed.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // 1. Create Donation Record
      const donationPayload: DonationInsert = {
        donor_id: profile.id,
        title: formData.title,
        description: formData.description || null,
        food_category: formData.food_category,
        dietary_type: formData.dietary_type,
        quantity: parseFloat(formData.quantity),
        quantity_unit: formData.quantity_unit,
        estimated_servings: parseInt(formData.estimated_servings, 10),
        prepared_at: new Date(formData.prepared_at).toISOString(),
        use_before: new Date(formData.use_before).toISOString(),
        storage_type: formData.storage_type,
        packaging_status: formData.packaging_status,
        allergen_information: formData.allergen_information || null,
        pickup_address: formData.pickup_address,
        pickup_latitude: pickupLocation[0],
        pickup_longitude: pickupLocation[1],
        donor_notes: formData.donor_notes || null,
        food_safety_acknowledged: formData.food_safety_acknowledged,
        status: 'AVAILABLE' // automatically go live for this demo
      }

      // Mock submit if supabase isn't configured, else try real
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')) {
        console.warn("MOCK SUBMIT: Supabase credentials not found. Pretending to succeed.")
        await new Promise(res => setTimeout(res, 1500)) // mock delay
        navigate('/donor/donations')
        return
      }

      const newDonation = await donationService.createDonation(donationPayload)

      // 2. Upload Image if exists
      if (imageFile) {
        await donationService.uploadDonationImage(imageFile, newDonation.id, true)
      }

      navigate('/donor/donations')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to create donation. Please check your inputs.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="px-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-[hsl(220,15%,12%)]">Create New Donation</h2>
          <p className="text-[hsl(220,10%,52%)] text-sm">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
            step >= i ? 'bg-[hsl(142,71%,28%)]' : 'bg-[hsl(220,13%,91%)]'
          }`} />
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext() }}>
        <Card>
          
          {/* STEP 1: FOOD DETAILS */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[hsl(142,60%,94%)] flex items-center justify-center">
                  <Package className="w-5 h-5 text-[hsl(142,71%,28%)]" />
                </div>
                <h3 className="text-lg font-bold">Food Details</h3>
              </div>

              <Input
                label="Donation Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. 40 portions of Vegetable Biryani"
                required
              />

              <div className="grid sm:grid-cols-2 gap-4">
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
                  ]}
                />
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
              </div>

              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the food, ingredients, or any other context..."
                rows={3}
              />

              <Input
                label="Allergen Information"
                name="allergen_information"
                value={formData.allergen_information}
                onChange={handleChange}
                placeholder="e.g. Contains nuts, dairy, gluten"
              />
            </div>
          )}

          {/* STEP 2: QUANTITY & EXPIRY */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[hsl(38,90%,94%)] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[hsl(38,95%,45%)]" />
                </div>
                <h3 className="text-lg font-bold">Quantity & Timeline</h3>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <Input
                  label="Quantity *"
                  name="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  required
                />
                <Select
                  label="Unit *"
                  name="quantity_unit"
                  value={formData.quantity_unit}
                  onChange={handleChange}
                  options={[
                    { value: 'servings', label: 'Servings' },
                    { value: 'kg', label: 'Kilograms' },
                    { value: 'boxes', label: 'Boxes' },
                    { value: 'liters', label: 'Liters' },
                  ]}
                />
                <Input
                  label="Estimated Meals *"
                  name="estimated_servings"
                  type="number"
                  min="1"
                  value={formData.estimated_servings}
                  onChange={handleChange}
                  placeholder="e.g. 20"
                  required
                  helperText="Total mouths this can feed"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-[hsl(220,13%,91%)]">
                <Input
                  label="Prepared / Cooked At *"
                  name="prepared_at"
                  type="datetime-local"
                  value={formData.prepared_at}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Strict Use By / Expiry *"
                  name="use_before"
                  type="datetime-local"
                  value={formData.use_before}
                  onChange={handleChange}
                  required
                  helperText="Food will be automatically delisted after this time"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Storage State"
                  name="storage_type"
                  value={formData.storage_type}
                  onChange={handleChange}
                  options={[
                    { value: 'ROOM_TEMPERATURE', label: 'Room Temperature' },
                    { value: 'REFRIGERATED', label: 'Refrigerated (Cold)' },
                    { value: 'FROZEN', label: 'Frozen' },
                    { value: 'HOT', label: 'Hot / Heated' },
                  ]}
                />
                <Select
                  label="Packaging Status"
                  name="packaging_status"
                  value={formData.packaging_status}
                  onChange={handleChange}
                  options={[
                    { value: 'SEALED', label: 'Sealed / Untouched' },
                    { value: 'PORTIONED', label: 'Individually Portioned' },
                    { value: 'BULK', label: 'Bulk Container (requires portions)' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* STEP 3: LOGISTICS & LOCATION */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[hsl(210,80%,94%)] flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[hsl(210,85%,45%)]" />
                </div>
                <h3 className="text-lg font-bold">Pickup Location</h3>
              </div>

              <Textarea
                label="Pickup Address *"
                name="pickup_address"
                value={formData.pickup_address}
                onChange={handleChange}
                placeholder="Full address where volunteers should collect the food..."
                required
                rows={2}
              />

              <div>
                <label className="block text-sm font-semibold text-[hsl(220,15%,20%)] mb-2">
                  Pin Point Location (For Navigation)
                </label>
                <div className="h-64 rounded-xl overflow-hidden border border-[hsl(220,13%,91%)] relative z-0">
                  <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://carto.com/">Carto</a>'
                    />
                    <LocationMarker position={pickupLocation} setPosition={setPickupLocation} />
                  </MapContainer>
                </div>
                <p className="text-xs text-[hsl(220,10%,52%)] mt-2">Click on the map to adjust the exact pickup pin.</p>
              </div>
            </div>
          )}

          {/* STEP 4: PHOTOS & REVIEW */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[hsl(270,70%,94%)] flex items-center justify-center">
                  <Camera className="w-5 h-5 text-[hsl(270,60%,45%)]" />
                </div>
                <h3 className="text-lg font-bold">Photos & Finalize</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[hsl(220,15%,20%)] mb-2">
                  Add a Photo (Recommended)
                </label>
                <div className="relative border-2 border-dashed border-[hsl(220,13%,85%)] rounded-xl p-6 text-center hover:bg-[hsl(220,13%,98%)] transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {imagePreview ? (
                    <div className="flex flex-col items-center">
                      <img src={imagePreview} alt="Preview" className="h-32 object-contain rounded-lg mb-3" />
                      <p className="text-sm text-[hsl(220,10%,52%)]">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4">
                      <UploadCloud className="w-10 h-10 text-[hsl(220,10%,60%)] mb-3" />
                      <p className="text-sm font-medium text-[hsl(220,15%,20%)]">Upload an image of the food</p>
                      <p className="text-xs text-[hsl(220,10%,52%)] mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <Textarea
                label="Instructions for Volunteers (Optional)"
                name="donor_notes"
                value={formData.donor_notes}
                onChange={handleChange}
                placeholder="e.g. Come to the back door, ring the bell, bring thermal bags..."
                rows={2}
              />

              <div className="p-4 rounded-xl bg-[hsl(38,90%,96%)] border border-[hsl(38,80%,85%)] flex items-start gap-3 mt-6">
                <Input
                  type="checkbox"
                  name="food_safety_acknowledged"
                  checked={formData.food_safety_acknowledged}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-bold text-[hsl(38,80%,30%)]">Food Safety Declaration</p>
                  <p className="text-xs text-[hsl(38,70%,40%)] mt-1">
                    I confirm that this food has been handled according to FSSAI/local safety guidelines, has not been contaminated, and is safe for human consumption.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-[hsl(220,13%,91%)]">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
            >
              Back
            </Button>
            
            {step < 4 ? (
              <Button type="submit" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Next Step
              </Button>
            ) : (
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isSubmitting} 
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="bg-[hsl(142,71%,28%)] hover:bg-[hsl(142,75%,22%)]"
              >
                Publish Donation
              </Button>
            )}
          </div>

        </Card>
      </form>

    </div>
  )
}
