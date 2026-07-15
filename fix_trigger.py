from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:z%254s%2Ck%40LfS9T%24Kr@db.pjhlnykfcqeprsmhzrtx.supabase.co:5432/postgres')
with engine.connect() as conn:
    conn.execute(text("""
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, full_name, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'),
    CAST(COALESCE(new.raw_user_meta_data->>'role', 'DONOR') AS public.user_role),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
"""))
    conn.commit()
print('Trigger updated successfully')
