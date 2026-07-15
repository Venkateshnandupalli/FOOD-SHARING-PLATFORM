-- ============================================================
-- Phase 9: Real-Time Chat & Messaging System
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_match ON chat_messages(match_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is part of a match
CREATE OR REPLACE FUNCTION is_match_participant(check_match_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_participant BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM matches m
        JOIN donations d ON d.id = m.donation_id
        JOIN organizations o ON o.id = m.recipient_organization_id
        LEFT JOIN deliveries del ON del.match_id = m.id
        WHERE m.id = check_match_id
        AND (
            d.donor_id = check_user_id 
            OR o.owner_id = check_user_id
            OR del.volunteer_id = check_user_id
        )
    ) INTO is_participant;
    
    RETURN is_participant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Policies
DO $$ BEGIN
    CREATE POLICY "Participants can read messages" ON chat_messages
        FOR SELECT
        USING (is_match_participant(match_id, auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Participants can insert messages" ON chat_messages
        FOR INSERT
        WITH CHECK (is_match_participant(match_id, auth.uid()) AND auth.uid() = sender_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
