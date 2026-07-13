// ─── Database Type Definitions ────────────────────────────────────────────────
// These mirror the Supabase PostgreSQL schema exactly.
// Update this file whenever you run a new migration.

export type UserRole = 'ADMIN' | 'DONOR' | 'RECIPIENT' | 'VOLUNTEER' | 'ANALYST'

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export type DonationStatus =
  | 'DRAFT'
  | 'AVAILABLE'
  | 'MATCHED'
  | 'ACCEPTED'
  | 'PICKUP_ASSIGNED'
  | 'COLLECTED'
  | 'DELIVERED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REJECTED'

export type DietaryType = 'VEGETARIAN' | 'NON_VEGETARIAN' | 'VEGAN' | 'JAIN' | 'MIXED'

export type FoodCategory =
  | 'COOKED_MEALS'
  | 'BAKERY'
  | 'FRUITS_VEGETABLES'
  | 'PACKAGED_FOOD'
  | 'DAIRY'
  | 'BEVERAGES'
  | 'SNACKS'
  | 'GRAINS_PULSES'
  | 'OTHER'

export type StorageType = 'ROOM_TEMPERATURE' | 'REFRIGERATED' | 'FROZEN' | 'HOT'

export type PackagingStatus = 'SEALED' | 'OPEN' | 'PORTIONED' | 'BULK'

export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export type DeliveryStatus =
  | 'ASSIGNED'
  | 'EN_ROUTE_PICKUP'
  | 'COLLECTED'
  | 'EN_ROUTE_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'

export type DeliveryPreference = 'SELF_PICKUP' | 'DELIVERY' | 'EITHER'

export type OrganizationType =
  | 'NGO'
  | 'FOOD_BANK'
  | 'ORPHANAGE'
  | 'SHELTER'
  | 'COMMUNITY_KITCHEN'
  | 'RELIEF_ORGANISATION'
  | 'OTHER'

// ─── Table row types ──────────────────────────────────────────────────────────

export interface Profile {
  id: string
  auth_user_id: string
  full_name: string
  phone: string | null
  role: UserRole
  profile_image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  owner_id: string
  organization_name: string
  organization_type: OrganizationType
  registration_number: string | null
  verification_status: VerificationStatus
  address: string
  city: string
  state: string
  postal_code: string | null
  latitude: number
  longitude: number
  storage_capacity: number | null
  contact_phone: string | null
  website_url: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationDocument {
  id: string
  organization_id: string
  document_type: string
  document_url: string
  verification_status: VerificationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Donation {
  id: string
  donor_id: string
  organization_id: string | null
  title: string
  description: string | null
  food_category: FoodCategory
  dietary_type: DietaryType
  quantity: number
  quantity_unit: string
  estimated_servings: number
  prepared_at: string
  use_before: string
  storage_type: StorageType
  packaging_status: PackagingStatus
  allergen_information: string | null
  pickup_address: string
  pickup_latitude: number
  pickup_longitude: number
  status: DonationStatus
  donor_notes: string | null
  created_at: string
  updated_at: string
  // Joined
  donor?: Profile
  images?: DonationImage[]
}

export interface DonationImage {
  id: string
  donation_id: string
  image_url: string
  uploaded_at: string
}

export interface RecipientRequirement {
  id: string
  recipient_organization_id: string
  food_category: FoodCategory | null
  dietary_type: DietaryType | null
  required_servings: number
  required_before: string
  delivery_preference: DeliveryPreference
  priority: 1 | 2 | 3 | 4 | 5
  notes: string | null
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED'
  created_at: string
}

export interface Match {
  id: string
  donation_id: string
  requirement_id: string | null
  recipient_organization_id: string
  distance_km: number
  urgency_score: number
  demand_score: number
  capacity_score: number
  reliability_score: number
  total_match_score: number
  match_status: MatchStatus
  generated_at: string
  responded_at: string | null
  // Joined
  donation?: Donation
  recipient_organization?: Organization
}

export interface Delivery {
  id: string
  match_id: string
  volunteer_id: string | null
  scheduled_pickup_at: string | null
  collected_at: string | null
  delivered_at: string | null
  quantity_collected: number | null
  quantity_delivered: number | null
  status: DeliveryStatus
  pickup_proof_url: string | null
  delivery_proof_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  match?: Match
  volunteer?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  link_url: string | null
  created_at: string
}

export interface ImpactMetric {
  id: string
  delivery_id: string
  food_weight_kg: number
  estimated_meals: number
  estimated_waste_avoided_kg: number
  calculated_at: string
}

export interface Rating {
  id: string
  delivery_id: string
  reviewer_id: string
  reviewed_user_id: string
  rating: 1 | 2 | 3 | 4 | 5
  category: 'FOOD_QUALITY' | 'PICKUP_EXPERIENCE' | 'DELIVERY_EXPERIENCE' | 'QUANTITY_ACCURACY'
  comments: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  ip_address: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── Supabase Database helper type ────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> }
      organization_documents: { Row: OrganizationDocument; Insert: Partial<OrganizationDocument>; Update: Partial<OrganizationDocument> }
      donations: { Row: Donation; Insert: Partial<Donation>; Update: Partial<Donation> }
      donation_images: { Row: DonationImage; Insert: Partial<DonationImage>; Update: Partial<DonationImage> }
      recipient_requirements: { Row: RecipientRequirement; Insert: Partial<RecipientRequirement>; Update: Partial<RecipientRequirement> }
      matches: { Row: Match; Insert: Partial<Match>; Update: Partial<Match> }
      deliveries: { Row: Delivery; Insert: Partial<Delivery>; Update: Partial<Delivery> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
      impact_metrics: { Row: ImpactMetric; Insert: Partial<ImpactMetric>; Update: Partial<ImpactMetric> }
      ratings: { Row: Rating; Insert: Partial<Rating>; Update: Partial<Rating> }
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      verification_status: VerificationStatus
      donation_status: DonationStatus
      dietary_type: DietaryType
      food_category: FoodCategory
      storage_type: StorageType
      packaging_status: PackagingStatus
      match_status: MatchStatus
      delivery_status: DeliveryStatus
      delivery_preference: DeliveryPreference
      organization_type: OrganizationType
    }
    CompositeTypes: Record<string, never>
  }
}

// ─── API Response wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}
