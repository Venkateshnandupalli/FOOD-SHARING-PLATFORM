-- ============================================================
-- SharePlate AI — Supabase Database Migration
-- Phase 3: Recipient Requirements RLS
-- ============================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Recipients can view their own requirements" ON recipient_requirements;
DROP POLICY IF EXISTS "Recipients can insert their own requirements" ON recipient_requirements;
DROP POLICY IF EXISTS "Recipients can update their own requirements" ON recipient_requirements;
DROP POLICY IF EXISTS "Recipients can delete their own requirements" ON recipient_requirements;
DROP POLICY IF EXISTS "Admins can view all requirements" ON recipient_requirements;
DROP POLICY IF EXISTS "Analysts can view all requirements" ON recipient_requirements;

-- Ensure RLS is enabled
ALTER TABLE recipient_requirements ENABLE ROW LEVEL SECURITY;

-- 1. Recipients can view their own requirements
CREATE POLICY "Recipients can view their own requirements"
  ON recipient_requirements FOR SELECT
  USING (
    recipient_organization_id IN (SELECT id FROM organizations WHERE owner_id = auth_profile_id())
  );

-- 2. Admins and Analysts can view all requirements
CREATE POLICY "Admins can view all requirements"
  ON recipient_requirements FOR SELECT
  USING (auth_user_role() IN ('ADMIN', 'ANALYST'));

-- 3. Recipients can insert requirements for their own organization
CREATE POLICY "Recipients can insert their own requirements"
  ON recipient_requirements FOR INSERT
  WITH CHECK (
    recipient_organization_id IN (SELECT id FROM organizations WHERE owner_id = auth_profile_id())
    AND auth_user_role() = 'RECIPIENT'
  );

-- 4. Recipients can update their own requirements
CREATE POLICY "Recipients can update their own requirements"
  ON recipient_requirements FOR UPDATE
  USING (
    recipient_organization_id IN (SELECT id FROM organizations WHERE owner_id = auth_profile_id())
    AND auth_user_role() = 'RECIPIENT'
  );

-- 5. Recipients can delete their own requirements (e.g. to cancel them)
CREATE POLICY "Recipients can delete their own requirements"
  ON recipient_requirements FOR DELETE
  USING (
    recipient_organization_id IN (SELECT id FROM organizations WHERE owner_id = auth_profile_id())
    AND auth_user_role() = 'RECIPIENT'
  );
