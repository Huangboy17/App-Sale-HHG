-- ============================================================
-- FIX PROFILES & ORGANIZATIONS RLS POLICIES & BACKFILL PROFILES
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. FIX ORGANIZATIONS POLICY (Allow authenticated users to read organizations)
DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations FOR SELECT
  TO authenticated
  USING (true);

-- 2. FIX PROFILES POLICIES (Allow select own profile + insert own profile)
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR organization_id = get_user_org_id());

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- 3. ENSURE HHG HOLDINGS ORGANIZATION EXISTS
INSERT INTO organizations (name, slug, company_name, company_address, hotline, website, email, default_sale_name, default_sale_phone, default_sale_email)
VALUES (
  'HHG Holdings',
  'hhg-holdings',
  'CÔNG TY TNHH HHG HOLDINGS',
  'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
  '+84 243 821 6666',
  'www.hhg.vn',
  'info@hhg.vn',
  'Nguyễn Thị Hương',
  '0978322208',
  'huongnt@hhg.vn'
)
ON CONFLICT (slug) DO NOTHING;

-- 4. BACKFILL PROFILES FOR ALL EXISTING AUTH.USERS
INSERT INTO profiles (id, organization_id, full_name, email, role)
SELECT
  u.id,
  (SELECT id FROM organizations WHERE slug = 'hhg-holdings' LIMIT 1),
  COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
  u.email,
  COALESCE(NULLIF(u.raw_user_meta_data->>'role', ''), 'SALE')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE
SET organization_id = EXCLUDED.organization_id,
    full_name = EXCLUDED.full_name;

-- 5. UPDATE TRIGGER FOR NEW USER SIGNUPS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_full_name TEXT;
  v_role TEXT;
  v_org_str TEXT;
BEGIN
  v_org_str := NEW.raw_user_meta_data->>'organization_id';

  IF v_org_str IS NOT NULL AND v_org_str <> '' AND v_org_str <> 'undefined' THEN
    BEGIN
      v_org_id := v_org_str::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_org_id := NULL;
    END;
  END IF;

  -- Default to HHG Holdings organization
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations WHERE slug = 'hhg-holdings' LIMIT 1;
    IF v_org_id IS NULL THEN
      SELECT id INTO v_org_id FROM organizations LIMIT 1;
    END IF;
  END IF;

  v_full_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1));
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'SALE');

  IF v_org_id IS NOT NULL THEN
    INSERT INTO profiles (id, organization_id, full_name, email, role)
    VALUES (NEW.id, v_org_id, v_full_name, NEW.email, v_role)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        organization_id = EXCLUDED.organization_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Verify profiles
SELECT id, full_name, email, role, organization_id FROM profiles;
