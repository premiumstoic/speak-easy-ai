
-- Create demo user Alice
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_user_meta_data)
VALUES (
  'aaaaaaaa-1111-4000-a000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'alice@demo.umay',
  crypt('Demo2026!Alice', gen_salt('bf')),
  now(), now(), now(), 'authenticated', 'authenticated',
  '{"full_name": "Alice"}'::jsonb
);

-- Create demo user Bob
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_user_meta_data)
VALUES (
  'bbbbbbbb-2222-4000-a000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'bob@demo.umay',
  crypt('Demo2026!Bob00', gen_salt('bf')),
  now(), now(), now(), 'authenticated', 'authenticated',
  '{"full_name": "Bob"}'::jsonb
);

-- Create identities for email auth
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  ('aaaaaaaa-1111-4000-a000-000000000001', 'aaaaaaaa-1111-4000-a000-000000000001', 'alice@demo.umay', 'email',
   jsonb_build_object('sub', 'aaaaaaaa-1111-4000-a000-000000000001', 'email', 'alice@demo.umay', 'email_verified', true),
   now(), now(), now()),
  ('bbbbbbbb-2222-4000-a000-000000000002', 'bbbbbbbb-2222-4000-a000-000000000002', 'bob@demo.umay', 'email',
   jsonb_build_object('sub', 'bbbbbbbb-2222-4000-a000-000000000002', 'email', 'bob@demo.umay', 'email_verified', true),
   now(), now(), now());
