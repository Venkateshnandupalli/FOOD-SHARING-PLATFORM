-- ============================================================
-- SharePlate AI — Supabase Database Migration
-- Phase 1.2: Volunteer Deliveries RPC
-- Run this in Supabase SQL Editor
-- ============================================================

-- This function allows Volunteers to see available matches waiting for delivery,
-- securely bypassing RLS without exposing the underlying matches table entirely.
CREATE OR REPLACE FUNCTION get_available_deliveries()
RETURNS TABLE (
  match_id UUID,
  donation_title TEXT,
  donor_name TEXT,
  donor_address TEXT,
  donor_lat DOUBLE PRECISION,
  donor_lng DOUBLE PRECISION,
  recipient_name TEXT,
  recipient_address TEXT,
  recipient_lat DOUBLE PRECISION,
  recipient_lng DOUBLE PRECISION,
  food_category TEXT,
  quantity NUMERIC,
  quantity_unit TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    m.id AS match_id,
    d.title AS donation_title,
    p.full_name AS donor_name,
    d.address AS donor_address,
    d.latitude AS donor_lat,
    d.longitude AS donor_lng,
    o.organization_name AS recipient_name,
    o.address AS recipient_address,
    o.latitude AS recipient_lat,
    o.longitude AS recipient_lng,
    d.food_category::TEXT,
    d.quantity,
    d.quantity_unit
  FROM matches m
  JOIN donations d ON m.donation_id = d.id
  JOIN profiles p ON d.donor_id = p.id
  JOIN organizations o ON m.recipient_organization_id = o.id
  LEFT JOIN deliveries del ON m.id = del.match_id
  WHERE m.match_status = 'ACCEPTED' 
  AND del.id IS NULL;
$$;
