-- ============================================================
-- SharePlate AI — Supabase Database Migration
-- Phase 4: Proactive Matching Engine v2
-- ============================================================

-- Function to automatically expire pending matches
CREATE OR REPLACE FUNCTION expire_stale_matches()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE matches
  SET match_status = 'EXPIRED', updated_at = NOW()
  WHERE match_status = 'PENDING' 
    AND expires_at < NOW();
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Main matching engine function
CREATE OR REPLACE FUNCTION generate_matches_for_donation(p_donation_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_donation RECORD;
  v_match_count INTEGER := 0;
BEGIN
  -- 1. Get donation details
  SELECT * INTO v_donation
  FROM donations
  WHERE id = p_donation_id AND status = 'AVAILABLE';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation is not available or does not exist.';
  END IF;

  -- 2. Prevent duplicate generation if there are already PENDING or ACCEPTED matches
  IF EXISTS (
    SELECT 1 FROM matches 
    WHERE donation_id = p_donation_id 
      AND match_status IN ('PENDING', 'ACCEPTED')
  ) THEN
    RAISE EXCEPTION 'Active matches already exist for this donation.';
  END IF;

  -- 3. Find top 3 organizations and insert them as PENDING matches
  WITH ranked_orgs AS (
    SELECT 
      o.id AS org_id,
      -- Distance in km
      (ST_Distance(v_donation.pickup_location, o.location) / 1000.0) AS dist_km,
      
      -- Distance Score (Max 50km radius. 0 at 50km, 1 at 0km)
      GREATEST(0, (50 - (ST_Distance(v_donation.pickup_location, o.location) / 1000.0)) / 50.0) AS dist_score,
      
      -- Urgency Score (Assumes max 24 hours urgency window. 1 if expiring now, 0 if 24+ hours)
      GREATEST(0, (24.0 - (EXTRACT(EPOCH FROM (v_donation.use_before - NOW())) / 3600.0)) / 24.0) AS urg_score,
      
      -- Demand Compatibility Score
      -- If they have an active requirement matching the food category, score = 1.0, else 0.5
      (
        SELECT CASE WHEN count(*) > 0 THEN 1.0 ELSE 0.5 END
        FROM recipient_requirements rr
        WHERE rr.recipient_organization_id = o.id
          AND rr.status = 'OPEN'
          AND rr.food_category = v_donation.food_category
      ) AS dem_score,
      
      -- Capacity Score
      -- 1.0 if capacity > 2 * donation, 0.8 if capacity >= donation, 0 if capacity < donation
      CASE 
        WHEN COALESCE(o.storage_capacity, 0) >= (v_donation.quantity * 2) THEN 1.0
        WHEN COALESCE(o.storage_capacity, 0) >= v_donation.quantity THEN 0.8
        ELSE 0.0
      END AS cap_score,
      
      -- Reliability Score (Mocked as 0.8 for now)
      0.8 AS rel_score,
      
      -- Transport Availability (Mocked as 0.8 for now)
      0.8 AS trans_score
      
    FROM organizations o
    WHERE o.verification_status = 'APPROVED'
      -- Only orgs within 50km
      AND ST_Distance(v_donation.pickup_location, o.location) <= 50000
      -- Only orgs that can store the food
      AND COALESCE(o.storage_capacity, 0) >= v_donation.quantity
  )
  INSERT INTO matches (
    donation_id,
    recipient_organization_id,
    distance_km,
    urgency_score,
    demand_score,
    capacity_score,
    reliability_score,
    transport_score,
    total_match_score,
    match_status,
    score_explanation,
    expires_at
  )
  SELECT
    p_donation_id,
    org_id,
    dist_km,
    urg_score,
    dem_score,
    cap_score,
    rel_score,
    trans_score,
    -- Compute Weighted Total Score
    (
      (0.25 * dist_score) + 
      (0.25 * urg_score) + 
      (0.20 * dem_score) + 
      (0.15 * cap_score) + 
      (0.10 * rel_score) + 
      (0.05 * trans_score)
    )::NUMERIC(5,4) AS total_score,
    'PENDING',
    -- Build JSON explanation
    jsonb_build_object(
      'distance_text', ROUND(dist_km::NUMERIC, 1) || ' km away',
      'urgency_text', 'Food expires in ' || ROUND((EXTRACT(EPOCH FROM (v_donation.use_before - NOW())) / 3600.0)::NUMERIC, 1) || ' hours',
      'demand_text', CASE WHEN dem_score = 1.0 THEN 'Specifically requested this food type' ELSE 'General food requirement' END,
      'capacity_text', 'Has sufficient storage capacity'
    ),
    NOW() + INTERVAL '30 minutes'
  FROM ranked_orgs
  ORDER BY 
    (
      (0.25 * dist_score) + 
      (0.25 * urg_score) + 
      (0.20 * dem_score) + 
      (0.15 * cap_score) + 
      (0.10 * rel_score) + 
      (0.05 * trans_score)
    ) DESC
  LIMIT 3;
  
  GET DIAGNOSTICS v_match_count = ROW_COUNT;
  RETURN v_match_count;
END;
$$;

-- Allow Recipient to explicitly reject a match
CREATE OR REPLACE FUNCTION reject_match(p_match_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE matches
  SET match_status = 'REJECTED', responded_at = NOW()
  WHERE id = p_match_id 
    AND recipient_organization_id = p_org_id 
    AND match_status = 'PENDING';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found or already processed.';
  END IF;
  
  RETURN TRUE;
END;
$$;
