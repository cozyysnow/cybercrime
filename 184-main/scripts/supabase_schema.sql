-- ============================================================================
-- CYBERCAST (SIH PS 184) - SUPABASE AUTHENTICATION & DEMO USERS SQL SCHEMA
-- Ministry of Home Affairs | Indian Cyber Crime Coordination Centre (I4C)
--
-- Instructions:
-- 1. Open your Supabase Project Dashboard: https://supabase.com/dashboard/project/xlbdypsxinbyqthszmvi
-- 2. Click on "SQL Editor" in the left navigation sidebar.
-- 3. Click "New query", paste this entire script, and click "Run" (or Ctrl/Cmd + Enter).
-- ============================================================================

-- Step 1: Ensure pgcrypto extension is active for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Grant full schema access to Supabase auth admin
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, authenticator, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

-- Step 3: Provision the 5 Law Enforcement Demo Accounts Idempotently
DO $$
DECLARE
  v_users JSONB := '[
    {
      "email": "i4c.dir01@cybercast.demo",
      "password": "CyberCast@I4C2024",
      "badgeId": "I4C-DIR-01",
      "name": "Dr. A. K. Saxena",
      "role": "i4c_central",
      "persona": "I4C Central Directorate"
    },
    {
      "email": "state.nodal.rj@cybercast.demo",
      "password": "CyberCast@State2024",
      "badgeId": "RJ-SP-Z04",
      "name": "Supt. R. Sharma",
      "role": "state_nodal",
      "persona": "State Cyber Nodal"
    },
    {
      "email": "district.jpr@cybercast.demo",
      "password": "CyberCast@District2024",
      "badgeId": "JPR-CI-889",
      "name": "Insp. P. Verma",
      "role": "district_cyber",
      "persona": "District Cyber Cell"
    },
    {
      "email": "field.si.jpr@cybercast.demo",
      "password": "CyberCast@Field2024",
      "badgeId": "JPR-SI-412",
      "name": "SI K. Mehta",
      "role": "field_investigator",
      "persona": "Field Investigator"
    },
    {
      "email": "bank.sbi.cfc@cybercast.demo",
      "password": "CyberCast@Bank2024",
      "badgeId": "SBI-CFC-91",
      "name": "M. Agarwal (SBI Fraud)",
      "role": "bank_fi",
      "persona": "Bank Fraud Investigator"
    }
  ]'::jsonb;
  v_user JSONB;
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  FOR v_user IN SELECT * FROM jsonb_array_elements(v_users)
  LOOP
    -- Check if user already exists by email
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user->>'email';
    -- Hash password with standard bcrypt cost 10
    v_encrypted_password := crypt(v_user->>'password', gen_salt('bf', 10));

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
      
      -- Insert into auth.users with pre-confirmed email
      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        phone_change,
        phone_change_token,
        email_change_token_current,
        reauthentication_token,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_user->>'email',
        v_encrypted_password,
        now(),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
          'badgeId', v_user->>'badgeId',
          'name', v_user->>'name',
          'role', v_user->>'role',
          'persona', v_user->>'persona',
          'email_verified', true
        ),
        now(),
        now()
      );

      -- Insert into auth.identities so signInWithPassword finds the email provider
      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_user->>'email',
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      );
    ELSE
      -- Update existing user credentials and metadata
      UPDATE auth.users SET
        encrypted_password = v_encrypted_password,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        raw_user_meta_data = jsonb_build_object(
          'badgeId', v_user->>'badgeId',
          'name', v_user->>'name',
          'role', v_user->>'role',
          'persona', v_user->>'persona',
          'email_verified', true
        ),
        updated_at = now()
      WHERE id = v_user_id;

      -- Update identities record
      UPDATE auth.identities SET
        identity_data = jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_user->>'email',
          'email_verified', true,
          'phone_verified', false
        ),
        updated_at = now()
      WHERE user_id = v_user_id AND provider = 'email';
    END IF;
  END LOOP;
END $$;

-- Step 4: Verification Query - returns all 5 demo accounts
SELECT 
  id, 
  email, 
  email_confirmed_at, 
  raw_user_meta_data->>'badgeId' AS badge_id,
  raw_user_meta_data->>'name' AS officer_name,
  raw_user_meta_data->>'role' AS role
FROM auth.users 
WHERE email LIKE '%@cybercast.demo'
ORDER BY email;
