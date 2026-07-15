from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres:z%254s%2Ck%40LfS9T%24Kr@db.pjhlnykfcqeprsmhzrtx.supabase.co:5432/postgres')
with engine.connect() as conn:
    result = conn.execute(text("SELECT organization_name FROM organizations")).fetchall()
    print(result)
