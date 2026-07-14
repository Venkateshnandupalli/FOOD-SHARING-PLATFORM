-- ============================================================
-- Phase 7: Analytics, Impact & Predictive Modeling
-- ============================================================

-- 1. Impact Metrics RPC
CREATE OR REPLACE FUNCTION get_impact_metrics()
RETURNS JSONB AS $$
DECLARE
    total_meals_delivered INTEGER;
    co2_prevented_kg NUMERIC;
    water_saved_liters NUMERIC;
    active_users INTEGER;
    active_orgs INTEGER;
BEGIN
    -- Calculate total successfully delivered meals
    SELECT COALESCE(SUM(d.estimated_servings), 0)
    INTO total_meals_delivered
    FROM donations d
    JOIN matches m ON m.donation_id = d.id
    JOIN deliveries del ON del.match_id = m.id
    WHERE del.status = 'DELIVERED';

    -- Environmental formulas
    -- Assumption: 1 meal prevents ~1.13 kg of CO2e
    -- Assumption: 1 meal saves ~378 liters of water (agriculture footprint)
    co2_prevented_kg := (total_meals_delivered * 1.13)::NUMERIC(10,2);
    water_saved_liters := (total_meals_delivered * 378)::NUMERIC(10,2);

    -- Active Users (logged in or created in last 30 days)
    SELECT COUNT(*) INTO active_users
    FROM profiles WHERE is_active = true;

    -- Verified Orgs
    SELECT COUNT(*) INTO active_orgs
    FROM organizations WHERE verification_status = 'APPROVED';

    RETURN jsonb_build_object(
        'totalMeals', total_meals_delivered,
        'co2PreventedKg', co2_prevented_kg,
        'waterSavedLiters', water_saved_liters,
        'activeUsers', active_users,
        'verifiedOrgs', active_orgs
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Predictive Demand Forecasting RPC
-- Analyzes active requirements and historical fulfillments to forecast "Hotspots"
CREATE OR REPLACE FUNCTION get_demand_forecast()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH DemandAggregation AS (
        SELECT 
            rr.food_category,
            SUM(rr.quantity_required) as total_requested,
            COUNT(rr.id) as active_requests
        FROM recipient_requirements rr
        JOIN organizations org ON rr.organization_id = org.id
        WHERE rr.status = 'OPEN' 
          AND org.verification_status = 'APPROVED'
        GROUP BY rr.food_category
    ),
    SupplyAggregation AS (
        SELECT 
            food_category,
            SUM(estimated_servings) as total_available
        FROM donations
        WHERE status = 'AVAILABLE'
        GROUP BY food_category
    ),
    CombinedForecast AS (
        SELECT 
            d.food_category,
            d.total_requested,
            d.active_requests,
            COALESCE(s.total_available, 0) as current_supply,
            -- Demand Score calculation: (Requested / (Available + 1)) * active_requests
            ( (d.total_requested / (COALESCE(s.total_available, 0) + 1)) * d.active_requests ) as demand_score
        FROM DemandAggregation d
        LEFT JOIN SupplyAggregation s ON d.food_category = s.food_category
        ORDER BY demand_score DESC
        LIMIT 5
    )
    SELECT COALESCE(jsonb_agg(row_to_json(cf)), '[]'::jsonb)
    INTO result
    FROM CombinedForecast cf;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Donation Trends (Last 7 Days) for Charting
CREATE OR REPLACE FUNCTION get_donation_trends()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH Last7Days AS (
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'::interval
        )::date as date_day
    ),
    DailyDonations AS (
        SELECT 
            DATE(created_at) as created_date,
            COUNT(id) as count
        FROM donations
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(created_at)
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', TO_CHAR(l.date_day, 'Mon DD'),
            'donations', COALESCE(d.count, 0)
        )
        ORDER BY l.date_day ASC
    )
    INTO result
    FROM Last7Days l
    LEFT JOIN DailyDonations d ON l.date_day = d.created_date;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
