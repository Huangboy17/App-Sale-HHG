-- ============================================================
-- 1. ADD COLUMNS & MODIFY CONSTRAINTS ON PROFILES
-- ============================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('SUPER_ADMIN', 'LEVEL_1', 'LEVEL_2', 'ADMIN', 'SALE', 'SALES_MANAGER', 'ACCOUNTING', 'WAREHOUSE', 'MANAGER', 'VIEWER'));

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'blocked', 'archived', 'active', 'pending')),
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level_2_limit INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- Keep backward compatibility for account_status if it exists, or migrate to status
UPDATE profiles SET status = 'ACTIVE' WHERE is_active = true AND (status IS NULL OR status = 'PENDING');
UPDATE profiles SET status = 'SUSPENDED' WHERE is_active = false;

-- Migrate existing roles
UPDATE profiles SET role = 'SUPER_ADMIN' WHERE role = 'ADMIN' OR role = 'admin';
UPDATE profiles SET role = 'LEVEL_1' WHERE role = 'SALE' OR role = 'user';

-- ============================================================
-- 2. HELPER FUNCTIONS FOR RLS (SECURITY DEFINER to avoid recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Modify existing get_user_org_id to ensure it's safe
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 3. UPDATE PROFILES TRIGGER FOR LEVEL 1 SIGNUP
-- ============================================================
-- When a new user signs up, if they don't specify an org, create one for them (Tenant)
-- and default role to LEVEL_1, status PENDING.
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
  v_full_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1));
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'LEVEL_1');

  -- Ensure we don't let people sign up as SUPER_ADMIN directly
  IF v_role = 'SUPER_ADMIN' AND NEW.email != 'buiviethoangktxd@gmail.com' THEN
    v_role := 'LEVEL_1';
  END IF;

  IF v_org_str IS NOT NULL AND v_org_str <> '' AND v_org_str <> 'undefined' THEN
    BEGIN
      v_org_id := v_org_str::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_org_id := NULL;
    END;
  END IF;

  -- If no org provided and it's LEVEL_1, create a new Tenant Organization
  IF v_org_id IS NULL AND v_role = 'LEVEL_1' THEN
    INSERT INTO organizations (name, slug, company_name)
    VALUES (v_full_name || ' Org', 'org-' || NEW.id, v_full_name)
    RETURNING id INTO v_org_id;
  END IF;

  -- Default fallback
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations WHERE slug = 'hhg-holdings' LIMIT 1;
    IF v_org_id IS NULL THEN
      SELECT id INTO v_org_id FROM organizations LIMIT 1;
    END IF;
  END IF;

  IF v_org_id IS NOT NULL THEN
    INSERT INTO profiles (id, organization_id, full_name, email, role, status)
    VALUES (NEW.id, v_org_id, v_full_name, NEW.email, v_role, CASE WHEN v_role = 'SUPER_ADMIN' THEN 'ACTIVE' ELSE 'PENDING' END)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        organization_id = EXCLUDED.organization_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. UPDATE RLS POLICIES FOR TENANT ISOLATION & SUPER ADMIN
-- ============================================================

-- Drop all existing policies we want to upgrade
DROP POLICY IF EXISTS "org_select" ON organizations;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- ORGANIZATIONS
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  get_user_role() = 'SUPER_ADMIN' OR id = get_user_org_id()
);
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (
  get_user_role() = 'SUPER_ADMIN' OR id = get_user_org_id()
);

-- PROFILES
-- SUPER_ADMIN can see all, LEVEL_1/2 can see users in their org
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  get_user_role() = 'SUPER_ADMIN' OR organization_id = get_user_org_id()
);
-- SUPER_ADMIN can update all, LEVEL_1 can update LEVEL_2 in their org, users can update themselves
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  get_user_role() = 'SUPER_ADMIN' OR id = auth.uid() OR (get_user_role() = 'LEVEL_1' AND organization_id = get_user_org_id() AND role = 'LEVEL_2')
);

-- Note: Other tables (products, customers, transactions, etc.) already have:
-- USING (organization_id = get_user_org_id())
-- We need to add SUPER_ADMIN override if we want SUPER_ADMIN to see all data, 
-- but prompt says: "Không được trực tiếp can thiệp vào dữ liệu nghiệp vụ của khách hàng nếu không cần thiết."
-- So we can leave business data RLS as-is. SUPER_ADMIN will only manage LEVEL 1 profiles.

-- ============================================================
-- 5. BOOTSTRAP SUPER ADMIN
-- ============================================================

DO $$
DECLARE
  super_admin_id UUID;
  super_admin_org UUID;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO super_admin_id FROM auth.users WHERE email = 'buiviethoangktxd@gmail.com';
  
  -- If exists, force SUPER_ADMIN and ACTIVE
  IF super_admin_id IS NOT NULL THEN
    UPDATE profiles 
    SET role = 'SUPER_ADMIN', status = 'ACTIVE' 
    WHERE id = super_admin_id;
  END IF;
END $$;
