-- ============================================================
-- Phase 10: Fix PostGIS location column for ORM compatibility
-- ============================================================

-- Drop the computed column and its index
DROP INDEX IF EXISTS idx_organizations_location;
ALTER TABLE organizations DROP COLUMN IF EXISTS location;

-- Re-add the column as standard geography type
ALTER TABLE organizations ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- Re-create the index
CREATE INDEX idx_organizations_location ON organizations USING GIST(location);

-- Function to keep location in sync with latitude and longitude
CREATE OR REPLACE FUNCTION update_organizations_location()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if lat/lng are provided
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_update_organizations_location ON organizations;
CREATE TRIGGER trg_update_organizations_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_organizations_location();

-- Backfill existing data
UPDATE organizations SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
