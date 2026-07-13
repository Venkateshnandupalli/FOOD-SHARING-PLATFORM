-- ============================================================
-- SharePlate AI — Supabase Database Migration
-- Phase 1.3: Deliveries RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- Allow volunteers to insert new delivery claims (assigning themselves)
CREATE POLICY "Volunteers can insert deliveries"
  ON deliveries FOR INSERT
  WITH CHECK (volunteer_id = auth_profile_id() AND auth_user_role() = 'VOLUNTEER');

-- Allow volunteers to update the status of deliveries assigned to them
CREATE POLICY "Volunteers can update their own deliveries"
  ON deliveries FOR UPDATE
  USING (volunteer_id = auth_profile_id() AND auth_user_role() = 'VOLUNTEER');
