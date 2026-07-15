from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres:z%254s%2Ck%40LfS9T%24Kr@db.pjhlnykfcqeprsmhzrtx.supabase.co:5432/postgres')
with engine.connect() as conn:
    try:
        conn.execute(text("""
        INSERT INTO organizations (
            owner_id, organization_name, organization_type, registration_number,
            address, city, state, postal_code, contact_phone, storage_capacity,
            latitude, longitude, verification_status
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'Test', 'NGO', '123',
            '123 Main St', 'City', 'State', '12345', '1234567890', 50,
            17.385, 78.4867, 'PENDING'
        )
        """))
    except Exception as e:
        print('Error:', e)
