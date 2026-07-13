-- ============================================================
-- SharePlate AI — Supabase Database Migration
-- Phase 1.1: Accept Donation RPC
-- Run this in Supabase SQL Editor
-- ============================================================

-- This function allows a Recipient to securely accept a donation,
-- bypassing RLS to insert the match and update the donation status.
CREATE OR REPLACE FUNCTION accept_donation(p_donation_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with database owner privileges to bypass RLS
AS $$
DECLARE
  v_status donation_status;
BEGIN
  -- 1. Check if donation exists and is AVAILABLE
  SELECT status INTO v_status FROM donations WHERE id = p_donation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation not found';
  END IF;
  
  IF v_status != 'AVAILABLE' THEN
    RAISE EXCEPTION 'Donation is no longer available';
  END IF;

  -- 2. Insert the Match
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

  -- 3. Update the Donation Status
  UPDATE donations
  SET status = 'MATCHED'
  WHERE id = p_donation_id;

  RETURN TRUE;
END;
$$;
