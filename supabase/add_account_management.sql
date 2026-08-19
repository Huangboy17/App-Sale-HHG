-- 1. Drop existing role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add new roles to the check constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('SUPER_ADMIN', 'LEVEL_1', 'LEVEL_2', 'ADMIN', 'SALE', 'SALES_MANAGER', 'ACCOUNTING', 'WAREHOUSE', 'MANAGER', 'VIEWER'));

-- 3. Add new columns for Account Management
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'pending', 'blocked', 'archived')),
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 5;

-- 4. Update existing profiles to have account_status = 'active'
UPDATE profiles SET account_status = 'active' WHERE account_status IS NULL;

-- 5. Set up SUPER_ADMIN (Optional - run this to convert an existing user to SUPER_ADMIN)
-- Replace 'your-email@example.com' with the email of the user you want to be super admin
-- UPDATE profiles SET role = 'SUPER_ADMIN' WHERE email = 'your-email@example.com';
