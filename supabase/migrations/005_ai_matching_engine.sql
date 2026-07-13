-- ============================================================
-- SharePlate AI — Supabase Database Migration
-- Phase 1.5: AI Matching Recommendation Engine
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION get_ai_recommended_matches(p_org_id UUID)
RETURNS TABLE (
  donation_id UUID,
  title TEXT,
  food_category TEXT,
  quantity NUMERIC,
  quantity_unit TEXT,
  use_before TIMESTAMPTZ,
  pickup_address TEXT,
  distance_km DOUBLE PRECISION,
  match_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_location GEOGRAPHY(POINT, 4326);
BEGIN
  -- 1. Get the organization's location
  SELECT location INTO v_org_location
  FROM organizations
  WHERE id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- 2. Query available donations, calculate distances and scores
  RETURN QUERY
  SELECT 
    d.id AS donation_id,
    d.title,
    d.food_category::TEXT,
    d.quantity,
    d.quantity_unit,
    d.use_before,
    d.pickup_address,
    -- Calculate distance in meters, convert to KM
    (ST_Distance(d.pickup_location, v_org_location) / 1000.0) AS distance_km,
    
    -- Calculate complex match score (0 to 100)
    -- Formula: 
    -- 1. Distance Score: Max 50 points (closer = higher)
    --    Uses a decay function: max(0, 50 - distance_km)
    -- 2. Urgency Score: Max 50 points (closer to expiry = higher)
    --    Uses remaining hours: max(0, 50 - (hours_remaining / 4))
    (
      -- Distance points
      GREATEST(0, 50 - (ST_Distance(d.pickup_location, v_org_location) / 1000.0))
      +
      -- Urgency points
      GREATEST(0, 50 - (EXTRACT(EPOCH FROM (d.use_before - NOW())) / 3600.0 / 2.0))
    )::NUMERIC(5,2) AS match_score

  FROM donations d
  WHERE d.status = 'AVAILABLE'
  AND d.use_before > NOW()
  -- Only show recommendations within 50km
  AND ST_Distance(d.pickup_location, v_org_location) <= 50000
  ORDER BY match_score DESC
  LIMIT 20;
END;
$$;
