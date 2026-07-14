-- ============================================================
-- Phase 6: Ratings & Trust Score Implementation
-- ============================================================

-- 1. Add trust score columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trust_score NUMERIC(3,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- 2. Ensure RLS on ratings table
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can read all ratings" ON ratings
        FOR SELECT
        USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own ratings" ON ratings
        FOR INSERT
        WITH CHECK (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Create the recalculation function
CREATE OR REPLACE FUNCTION recalculate_trust_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET 
        total_ratings = (SELECT COUNT(*) FROM ratings WHERE reviewed_user_id = NEW.reviewed_user_id),
        trust_score = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM ratings WHERE reviewed_user_id = NEW.reviewed_user_id), 5.00)
    WHERE id = NEW.reviewed_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach trigger to ratings table
DROP TRIGGER IF EXISTS update_trust_score_trigger ON ratings;
CREATE TRIGGER update_trust_score_trigger
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION recalculate_trust_score();
