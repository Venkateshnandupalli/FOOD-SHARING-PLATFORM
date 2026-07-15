import bcrypt
from sqlalchemy import create_engine, text

# Hash 'password123'
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(b'password123', salt).decode('utf-8')

# Update database
engine = create_engine('postgresql://postgres:z%254s%2Ck%40LfS9T%24Kr@db.pjhlnykfcqeprsmhzrtx.supabase.co:5432/postgres')
with engine.connect() as conn:
    conn.execute(text("UPDATE auth.users SET encrypted_password = :hashed WHERE email = 'ngo@test.com'"), {'hashed': hashed})
    conn.commit()
print('Password updated successfully')
