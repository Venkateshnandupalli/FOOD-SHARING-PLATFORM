-- ============================================================
-- Migration: Add is_onboarded flag for OAuth onboarding
-- ============================================================

-- Add the column with a default of false
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;

-- Update existing profiles to true, as they were already onboarded through the register flow
UPDATE public.profiles SET is_onboarded = TRUE;

-- Update the handle_new_user function to set is_onboarded correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role user_role;
  v_is_onboarded boolean;
BEGIN
  -- If role is provided in metadata, they came from the custom register form
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := (new.raw_user_meta_data->>'role')::user_role;
    v_is_onboarded := TRUE;
  ELSE
    -- If no role, they came from OAuth (or an incomplete signup)
    v_role := 'DONOR'::user_role;
    v_is_onboarded := FALSE;
  END IF;

  INSERT INTO public.profiles (auth_user_id, full_name, role, is_onboarded, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'name', 'Unknown User')),
    v_role,
    v_is_onboarded,
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
