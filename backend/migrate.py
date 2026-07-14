import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env.local")

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def run_migration(filepath):
    if not DATABASE_URL:
        print("DATABASE_URL not found.")
        return
    
    engine = create_engine(DATABASE_URL)
    
    with open(filepath, 'r', encoding='utf-8') as file:
        sql = file.read()
        
    with engine.begin() as conn:
        print(f"Applying {filepath}...")
        conn.execute(text(sql))
        print("Done!")

if __name__ == "__main__":
    # We will apply migration 009 and 010 just to be sure
    run_migration("../supabase/migrations/009_ratings_and_trust.sql")
    run_migration("../supabase/migrations/010_analytics_and_forecasting.sql")
