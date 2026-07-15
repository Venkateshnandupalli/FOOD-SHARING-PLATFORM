from sqlalchemy import create_engine, text
import time

engine = create_engine('postgresql://postgres:z%254s%2Ck%40LfS9T%24Kr@db.pjhlnykfcqeprsmhzrtx.supabase.co:5432/postgres')

max_retries = 3
for attempt in range(max_retries):
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE organizations DROP COLUMN location;
                ALTER TABLE organizations ADD COLUMN location GEOGRAPHY(POINT, 4326);
                
                CREATE OR REPLACE FUNCTION update_organizations_location()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                
                DROP TRIGGER IF EXISTS trg_update_organizations_location ON organizations;
                CREATE TRIGGER trg_update_organizations_location
                BEFORE INSERT OR UPDATE ON organizations
                FOR EACH ROW
                EXECUTE FUNCTION update_organizations_location();
            """))
            conn.commit()
            print('PostGIS table updated successfully')
            break
    except Exception as e:
        print('Attempt', attempt, 'failed:', e)
        time.sleep(2)
