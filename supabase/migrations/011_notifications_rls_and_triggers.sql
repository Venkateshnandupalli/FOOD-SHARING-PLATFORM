-- ============================================================
-- Phase 8: Notifications and Alerts RLS & Triggers
-- ============================================================

-- 1. Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can read own notifications" ON notifications
        FOR SELECT
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own notifications" ON notifications
        FOR UPDATE
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 2. Trigger for Organization Approval
CREATE OR REPLACE FUNCTION notify_org_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status = 'APPROVED' AND OLD.verification_status != 'APPROVED' THEN
        INSERT INTO notifications (user_id, title, message, notification_type, link_url)
        VALUES (
            NEW.owner_id, 
            'Organization Approved!', 
            'Your organization ' || NEW.organization_name || ' has been verified. You can now receive matches.',
            'ORG_APPROVED',
            '/recipient/dashboard'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_org_approval ON organizations;
CREATE TRIGGER on_org_approval
AFTER UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION notify_org_approval();


-- 3. Trigger for Match Creation (Notify Recipient)
CREATE OR REPLACE FUNCTION notify_match_created()
RETURNS TRIGGER AS $$
DECLARE
    recip_owner_id UUID;
    donation_title TEXT;
BEGIN
    IF NEW.match_status = 'PENDING' THEN
        -- Get recipient owner id
        SELECT owner_id INTO recip_owner_id FROM organizations WHERE id = NEW.recipient_organization_id;
        -- Get donation title
        SELECT title INTO donation_title FROM donations WHERE id = NEW.donation_id;

        INSERT INTO notifications (user_id, title, message, notification_type, link_url)
        VALUES (
            recip_owner_id,
            'New Food Match!',
            'You have been matched with a new donation: ' || donation_title || '. Review and accept it soon.',
            'MATCH_PENDING',
            '/recipient/dashboard'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_match_created ON matches;
CREATE TRIGGER on_match_created
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION notify_match_created();


-- 4. Trigger for Match Accepted (Notify Donor)
CREATE OR REPLACE FUNCTION notify_match_accepted()
RETURNS TRIGGER AS $$
DECLARE
    don_owner_id UUID;
    donation_title TEXT;
    recip_name TEXT;
BEGIN
    IF NEW.match_status = 'ACCEPTED' AND OLD.match_status != 'ACCEPTED' THEN
        -- Get donor id
        SELECT donor_id, title INTO don_owner_id, donation_title FROM donations WHERE id = NEW.donation_id;
        -- Get recipient name
        SELECT organization_name INTO recip_name FROM organizations WHERE id = NEW.recipient_organization_id;

        INSERT INTO notifications (user_id, title, message, notification_type, link_url)
        VALUES (
            don_owner_id,
            'Match Accepted!',
            recip_name || ' has accepted your donation: ' || donation_title || '.',
            'MATCH_ACCEPTED',
            '/donor/donations/' || NEW.donation_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_match_accepted ON matches;
CREATE TRIGGER on_match_accepted
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION notify_match_accepted();


-- 5. Trigger for Delivery Completed (Notify both)
CREATE OR REPLACE FUNCTION notify_delivery_completed()
RETURNS TRIGGER AS $$
DECLARE
    don_owner_id UUID;
    recip_owner_id UUID;
    donation_title TEXT;
BEGIN
    IF NEW.status = 'DELIVERED' AND OLD.status != 'DELIVERED' THEN
        -- Get related details through match
        SELECT d.donor_id, d.title, o.owner_id
        INTO don_owner_id, donation_title, recip_owner_id
        FROM matches m
        JOIN donations d ON m.donation_id = d.id
        JOIN organizations o ON m.recipient_organization_id = o.id
        WHERE m.id = NEW.match_id;

        -- Notify Donor
        INSERT INTO notifications (user_id, title, message, notification_type, link_url)
        VALUES (
            don_owner_id,
            'Delivery Completed',
            'Your donation (' || donation_title || ') has been successfully delivered! Don''t forget to leave a rating.',
            'DELIVERY_COMPLETED',
            '/donor/dashboard'
        );

        -- Notify Recipient
        INSERT INTO notifications (user_id, title, message, notification_type, link_url)
        VALUES (
            recip_owner_id,
            'Delivery Arrived',
            'Your matched donation (' || donation_title || ') has been delivered! Don''t forget to leave a rating.',
            'DELIVERY_COMPLETED',
            '/recipient/dashboard'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_delivery_completed ON deliveries;
CREATE TRIGGER on_delivery_completed
AFTER UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION notify_delivery_completed();
