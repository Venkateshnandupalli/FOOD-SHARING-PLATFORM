-- ============================================================
-- SharePlate AI — Supabase Database Migration
-- Phase 1: Core schema with PostGIS and RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'DONOR', 'RECIPIENT', 'VOLUNTEER', 'ANALYST');

CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

CREATE TYPE donation_status AS ENUM (
  'DRAFT', 'AVAILABLE', 'MATCHED', 'ACCEPTED',
  'PICKUP_ASSIGNED', 'COLLECTED', 'DELIVERED', 'EXPIRED', 'CANCELLED', 'REJECTED'
);

CREATE TYPE dietary_type AS ENUM ('VEGETARIAN', 'NON_VEGETARIAN', 'VEGAN', 'JAIN', 'MIXED');

CREATE TYPE food_category AS ENUM (
  'COOKED_MEALS', 'BAKERY', 'FRUITS_VEGETABLES', 'PACKAGED_FOOD',
  'DAIRY', 'BEVERAGES', 'SNACKS', 'GRAINS_PULSES', 'OTHER'
);

CREATE TYPE storage_type AS ENUM ('ROOM_TEMPERATURE', 'REFRIGERATED', 'FROZEN', 'HOT');

CREATE TYPE packaging_status AS ENUM ('SEALED', 'OPEN', 'PORTIONED', 'BULK');

CREATE TYPE match_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

CREATE TYPE delivery_status AS ENUM (
  'ASSIGNED', 'EN_ROUTE_PICKUP', 'COLLECTED', 'EN_ROUTE_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'
);

CREATE TYPE delivery_preference AS ENUM ('SELF_PICKUP', 'DELIVERY', 'EITHER');

CREATE TYPE organization_type AS ENUM (
  'NGO', 'FOOD_BANK', 'ORPHANAGE', 'SHELTER', 'COMMUNITY_KITCHEN', 'RELIEF_ORGANISATION', 'OTHER'
);

CREATE TYPE requirement_status AS ENUM ('OPEN', 'MATCHED', 'FULFILLED', 'CANCELLED');

CREATE TYPE rating_category AS ENUM (
  'FOOD_QUALITY', 'PICKUP_EXPERIENCE', 'DELIVERY_EXPERIENCE', 'QUANTITY_ACCURACY'
);

-- ============================================================
-- HELPER: updated_at trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: profiles
-- Extended user data beyond auth.users
-- ============================================================

CREATE TABLE profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  phone            TEXT,
  role             user_role NOT NULL DEFAULT 'DONOR',
  profile_image_url TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: organizations
-- ============================================================

CREATE TABLE organizations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name     TEXT NOT NULL,
  organization_type     organization_type NOT NULL,
  registration_number   TEXT,
  verification_status   verification_status NOT NULL DEFAULT 'PENDING',
  address               TEXT NOT NULL,
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL DEFAULT 'Andhra Pradesh',
  postal_code           TEXT,
  latitude              DOUBLE PRECISION NOT NULL,
  longitude             DOUBLE PRECISION NOT NULL,
  location              GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
                          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                        ) STORED,
  storage_capacity      INTEGER,    -- in meals
  contact_phone         TEXT,
  website_url           TEXT,
  description           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_location ON organizations USING GIST(location);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_status ON organizations(verification_status);

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: organization_documents
-- ============================================================

CREATE TABLE organization_documents (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_type         TEXT NOT NULL,   -- e.g. 'NGO_REGISTRATION', 'PAN_CARD', 'ADDRESS_PROOF'
  document_url          TEXT NOT NULL,
  verification_status   verification_status NOT NULL DEFAULT 'PENDING',
  reviewed_by           UUID REFERENCES profiles(id),
  reviewed_at           TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_org_docs_org ON organization_documents(organization_id);

-- ============================================================
-- TABLE: donations
-- ============================================================

CREATE TABLE donations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id       UUID REFERENCES organizations(id),
  title                 TEXT NOT NULL,
  description           TEXT,
  food_category         food_category NOT NULL,
  dietary_type          dietary_type NOT NULL,
  quantity              NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  quantity_unit         TEXT NOT NULL DEFAULT 'servings',
  estimated_servings    INTEGER NOT NULL CHECK (estimated_servings > 0),
  prepared_at           TIMESTAMPTZ NOT NULL,
  use_before            TIMESTAMPTZ NOT NULL,
  storage_type          storage_type NOT NULL DEFAULT 'ROOM_TEMPERATURE',
  packaging_status      packaging_status NOT NULL DEFAULT 'SEALED',
  allergen_information  TEXT,
  pickup_address        TEXT NOT NULL,
  pickup_latitude       DOUBLE PRECISION NOT NULL,
  pickup_longitude      DOUBLE PRECISION NOT NULL,
  pickup_location       GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
                          ST_SetSRID(ST_MakePoint(pickup_longitude, pickup_latitude), 4326)::geography
                        ) STORED,
  status                donation_status NOT NULL DEFAULT 'DRAFT',
  donor_notes           TEXT,
  food_safety_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_use_before_after_prepared CHECK (use_before > prepared_at)
);

CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_location ON donations USING GIST(pickup_location);
CREATE INDEX idx_donations_use_before ON donations(use_before);
CREATE INDEX idx_donations_created ON donations(created_at DESC);

CREATE TRIGGER trg_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: donation_images
-- ============================================================

CREATE TABLE donation_images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donation_id   UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donation_images_donation ON donation_images(donation_id);

-- ============================================================
-- TABLE: recipient_requirements
-- ============================================================

CREATE TABLE recipient_requirements (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  food_category               food_category,
  dietary_type                dietary_type,
  required_servings           INTEGER NOT NULL CHECK (required_servings > 0),
  required_before             TIMESTAMPTZ NOT NULL,
  delivery_preference         delivery_preference NOT NULL DEFAULT 'EITHER',
  priority                    SMALLINT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  notes                       TEXT,
  status                      requirement_status NOT NULL DEFAULT 'OPEN',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requirements_org ON recipient_requirements(recipient_organization_id);
CREATE INDEX idx_requirements_status ON recipient_requirements(status);

CREATE TRIGGER trg_requirements_updated_at
  BEFORE UPDATE ON recipient_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: matches
-- ============================================================

CREATE TABLE matches (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donation_id                 UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  requirement_id              UUID REFERENCES recipient_requirements(id),
  recipient_organization_id   UUID NOT NULL REFERENCES organizations(id),
  distance_km                 NUMERIC(8,3) NOT NULL,
  urgency_score               NUMERIC(5,4) NOT NULL CHECK (urgency_score BETWEEN 0 AND 1),
  demand_score                NUMERIC(5,4) NOT NULL CHECK (demand_score BETWEEN 0 AND 1),
  capacity_score              NUMERIC(5,4) NOT NULL CHECK (capacity_score BETWEEN 0 AND 1),
  reliability_score           NUMERIC(5,4) NOT NULL CHECK (reliability_score BETWEEN 0 AND 1),
  transport_score             NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  total_match_score           NUMERIC(5,4) NOT NULL CHECK (total_match_score BETWEEN 0 AND 1),
  match_status                match_status NOT NULL DEFAULT 'PENDING',
  score_explanation           JSONB,         -- stores human-readable explanation
  generated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at                TIMESTAMPTZ,
  expires_at                  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes')
);

CREATE INDEX idx_matches_donation ON matches(donation_id);
CREATE INDEX idx_matches_recipient ON matches(recipient_organization_id);
CREATE INDEX idx_matches_status ON matches(match_status);
CREATE INDEX idx_matches_score ON matches(total_match_score DESC);

-- ============================================================
-- TABLE: deliveries
-- ============================================================

CREATE TABLE deliveries (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id              UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  volunteer_id          UUID REFERENCES profiles(id),
  pickup_otp_hash       TEXT,
  delivery_otp_hash     TEXT,
  scheduled_pickup_at   TIMESTAMPTZ,
  collected_at          TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  quantity_collected    NUMERIC(10,2),
  quantity_delivered    NUMERIC(10,2),
  status                delivery_status NOT NULL DEFAULT 'ASSIGNED',
  pickup_proof_url      TEXT,
  delivery_proof_url    TEXT,
  notes                 TEXT,
  issue_reported        BOOLEAN NOT NULL DEFAULT FALSE,
  issue_description     TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_match ON deliveries(match_id);
CREATE INDEX idx_deliveries_volunteer ON deliveries(volunteer_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

CREATE TRIGGER trg_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: status_history
-- Full audit trail of all status changes
-- ============================================================

CREATE TABLE status_history (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type      TEXT NOT NULL,   -- 'donation', 'match', 'delivery', 'organization'
  entity_id        UUID NOT NULL,
  previous_status  TEXT,
  new_status       TEXT NOT NULL,
  changed_by       UUID REFERENCES profiles(id),
  changed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason           TEXT,
  metadata         JSONB
);

CREATE INDEX idx_status_history_entity ON status_history(entity_type, entity_id);
CREATE INDEX idx_status_history_changed_at ON status_history(changed_at DESC);

-- ============================================================
-- TABLE: ratings
-- ============================================================

CREATE TABLE ratings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id       UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  reviewer_id       UUID NOT NULL REFERENCES profiles(id),
  reviewed_user_id  UUID NOT NULL REFERENCES profiles(id),
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category          rating_category NOT NULL,
  comments          TEXT,
  is_flagged        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (delivery_id, reviewer_id, category)
);

CREATE INDEX idx_ratings_delivery ON ratings(delivery_id);
CREATE INDEX idx_ratings_reviewed_user ON ratings(reviewed_user_id);

-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  message             TEXT NOT NULL,
  notification_type   TEXT NOT NULL,
  is_read             BOOLEAN NOT NULL DEFAULT FALSE,
  link_url            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE NOT is_read;

-- ============================================================
-- TABLE: impact_metrics
-- Calculated on delivery completion
-- ============================================================

CREATE TABLE impact_metrics (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id                 UUID NOT NULL UNIQUE REFERENCES deliveries(id),
  food_weight_kg              NUMERIC(10,3) NOT NULL,
  estimated_meals             INTEGER NOT NULL,
  estimated_waste_avoided_kg  NUMERIC(10,3) NOT NULL,
  co2_avoided_kg              NUMERIC(10,3),  -- optional, only if methodology is documented
  calculated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: audit_logs
-- Security audit trail
-- ============================================================

CREATE TABLE audit_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES profiles(id),
  action         TEXT NOT NULL,
  resource_type  TEXT NOT NULL,
  resource_id    UUID,
  ip_address     INET,
  user_agent     TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipient_requirements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's profile id
CREATE OR REPLACE FUNCTION auth_profile_id() RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (auth_user_role() = 'ADMIN');

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- ── organizations ─────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view approved organizations"
  ON organizations FOR SELECT
  USING (verification_status = 'APPROVED' OR owner_id = auth_profile_id() OR auth_user_role() = 'ADMIN');

CREATE POLICY "Owners can insert their organization"
  ON organizations FOR INSERT
  WITH CHECK (owner_id = auth_profile_id());

CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (owner_id = auth_profile_id() OR auth_user_role() = 'ADMIN');

-- ── donations ─────────────────────────────────────────────────────────────────
CREATE POLICY "Donors can view their own donations"
  ON donations FOR SELECT
  USING (donor_id = auth_profile_id() OR auth_user_role() IN ('ADMIN', 'ANALYST'));

CREATE POLICY "Recipients can see available and matched donations"
  ON donations FOR SELECT
  USING (status IN ('AVAILABLE', 'MATCHED') OR donor_id = auth_profile_id() OR auth_user_role() = 'ADMIN');

CREATE POLICY "Donors can insert donations"
  ON donations FOR INSERT
  WITH CHECK (donor_id = auth_profile_id() AND auth_user_role() = 'DONOR');

CREATE POLICY "Donors can update their own donations"
  ON donations FOR UPDATE
  USING (donor_id = auth_profile_id() OR auth_user_role() = 'ADMIN');

-- ── matches ───────────────────────────────────────────────────────────────────
CREATE POLICY "Recipients can see their matches"
  ON matches FOR SELECT
  USING (
    recipient_organization_id IN (SELECT id FROM organizations WHERE owner_id = auth_profile_id())
    OR auth_user_role() IN ('ADMIN', 'ANALYST')
  );

-- ── deliveries ────────────────────────────────────────────────────────────────
CREATE POLICY "Volunteers see their assigned deliveries"
  ON deliveries FOR SELECT
  USING (volunteer_id = auth_profile_id() OR auth_user_role() IN ('ADMIN', 'ANALYST'));

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE POLICY "Users see their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth_profile_id());

CREATE POLICY "Users can mark their notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth_profile_id());

-- ── ratings ───────────────────────────────────────────────────────────────────
CREATE POLICY "Users can insert ratings for their deliveries"
  ON ratings FOR INSERT
  WITH CHECK (reviewer_id = auth_profile_id());

CREATE POLICY "Admins can view all ratings"
  ON ratings FOR SELECT
  USING (reviewer_id = auth_profile_id() OR auth_user_role() = 'ADMIN');

-- ── audit_logs ────────────────────────────────────────────────────────────────
CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth_user_role() = 'ADMIN');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Active donations with distance (example for Kakinada: 16.9891° N, 82.2475° E)
CREATE OR REPLACE VIEW active_donations AS
SELECT
  d.*,
  p.full_name AS donor_name,
  EXTRACT(EPOCH FROM (d.use_before - NOW())) / 60 AS minutes_remaining
FROM donations d
JOIN profiles p ON p.id = d.donor_id
WHERE d.status IN ('AVAILABLE', 'MATCHED')
  AND d.use_before > NOW()
ORDER BY d.use_before ASC;

-- Platform summary stats
CREATE OR REPLACE VIEW platform_stats AS
SELECT
  COUNT(*) FILTER (WHERE d.status = 'DELIVERED')   AS total_delivered,
  COUNT(*) FILTER (WHERE d.status = 'AVAILABLE')   AS currently_available,
  COUNT(*) FILTER (WHERE d.status = 'EXPIRED')     AS total_expired,
  COALESCE(SUM(im.food_weight_kg), 0)            AS total_food_rescued_kg,
  COALESCE(SUM(im.estimated_meals), 0)           AS total_meals_supported,
  COUNT(DISTINCT d.donor_id)                     AS unique_donors
FROM donations d
LEFT JOIN matches m ON m.donation_id = d.id AND m.match_status = 'ACCEPTED'
LEFT JOIN deliveries dv ON dv.match_id = m.id
LEFT JOIN impact_metrics im ON im.delivery_id = dv.id;

-- ============================================================
-- STORAGE BUCKETS (run in Supabase Dashboard or via API)
-- ============================================================
-- Create these storage buckets in Supabase Dashboard:
--   1. donation-images    (public)
--   2. org-documents      (private)
--   3. delivery-proofs    (private)
--   4. profile-images     (public)

-- ============================================================
-- SAMPLE SEED DATA (Kakinada region, for development only)
-- ============================================================

-- Note: Replace these UUIDs with actual auth.users IDs after registration.
-- Run AFTER creating test accounts in Supabase Auth.

-- INSERT INTO profiles (auth_user_id, full_name, phone, role) VALUES
--   ('replace-with-real-uuid', 'GreenLeaf Restaurant', '+91-9876543210', 'DONOR'),
--   ('replace-with-real-uuid', 'Hope Community Centre', '+91-9876543211', 'RECIPIENT'),
--   ('replace-with-real-uuid', 'Ravi Kumar', '+91-9876543212', 'VOLUNTEER'),
--   ('replace-with-real-uuid', 'Platform Admin', '+91-9876543213', 'ADMIN');
