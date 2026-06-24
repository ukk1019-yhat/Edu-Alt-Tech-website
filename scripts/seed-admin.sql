-- Run this in Supabase Dashboard → SQL Editor to create the admin user directly.
-- No service_role key needed — runs inside the DB as a superuser.

DO $$
DECLARE
  _uid uuid := gen_random_uuid();
BEGIN
  -- Remove existing admin user if any
  DELETE FROM auth.users WHERE email = 'admin@edualttech.com';

  -- Insert directly into auth.users with email confirmed
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    _uid, '00000000-0000-0000-0000-000000000000',
    'admin@edualttech.com',
    crypt('Admin@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', 'Platform Admin', 'full_name', 'Platform Admin'),
    now(), now(), '', '', '', ''
  );

  -- Create user profile in public.users table
  INSERT INTO public.users (id, name, email, role, created_at)
  VALUES (_uid, 'Platform Admin', 'admin@edualttech.com', 'admin', now())
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  RAISE NOTICE 'Admin created: admin@edualttech.com / Admin@123456';
END $$;
