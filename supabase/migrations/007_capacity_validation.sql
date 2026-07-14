-- ============================================================
-- SharePlate AI — Supabase Database Migration
-- Phase 3: Capacity Validation for accept_donation RPC
-- ============================================================

CREATE OR REPLACE FUNCTION accept_donation(p_donation_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status donation_status;
  v_donation_quantity INTEGER;
  v_org_capacity INTEGER;
BEGIN
  -- 1. Check if donation exists and is AVAILABLE
  SELECT status, quantity 
  INTO v_status, v_donation_quantity 
  FROM donations 
  WHERE id = p_donation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation not found';
  END IF;
  
  IF v_status != 'AVAILABLE' THEN
    RAISE EXCEPTION 'Donation is no longer available';
  END IF;

  -- 2. Verify Recipient Capacity
  SELECT storage_capacity 
  INTO v_org_capacity 
  FROM organizations 
  WHERE id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- Strict capacity check: ensure the new donation quantity doesn't exceed storage capacity
  IF v_org_capacity IS NOT NULL AND v_donation_quantity > v_org_capacity THEN
    RAISE EXCEPTION 'Donation quantity exceeds your storage capacity.';
  END IF;

  -- 3. Insert the Match
  INSERT INTO matches (
    donation_id,
    recipient_organization_id,
    distance_km,
    match_status,
    urgency_score,
    demand_score,
    capacity_score,
    reliability_score,
    total_match_score
  ) VALUES (
    p_donation_id,
    p_org_id,
    0, -- Mock distance for manual claim
    'ACCEPTED',
    1.0, 1.0, 1.0, 1.0, 1.0
  );

  -- 4. Update the Donation Status
  UPDATE donations
  SET status = 'MATCHED'
  WHERE id = p_donation_id;

  RETURN TRUE;
END;
$$;
