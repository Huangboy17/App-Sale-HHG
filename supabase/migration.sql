-- ============================================================
-- SUPABASE MIGRATION SCRIPT
-- App-Sale-HHG: Multi-Tenant Sales Management System
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ============================================================
-- 1. ORGANIZATIONS (Multi-Tenant Root)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  -- Thông tin hiển thị trên chứng từ
  company_name TEXT,
  company_address TEXT,
  hotline TEXT,
  website TEXT,
  email TEXT,
  logo_url TEXT,
  -- Thông tin sale mặc định
  default_sale_name TEXT,
  default_sale_phone TEXT,
  default_sale_email TEXT,
  -- Settings mở rộng
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. PROFILES (Linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'SALE'
    CHECK (role IN ('ADMIN','SALE','SALES_MANAGER','ACCOUNTING','WAREHOUSE','MANAGER','VIEWER')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  product_group TEXT DEFAULT '',
  unit TEXT DEFAULT 'Cái',
  base_price NUMERIC DEFAULT 0,
  max_discount_rate NUMERIC DEFAULT 0,
  dp_price NUMERIC DEFAULT 0,
  vat_rate NUMERIC DEFAULT 0.08,
  stock_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','INACTIVE','DISCONTINUED')),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, product_code)
);

CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(organization_id, product_code);

-- ============================================================
-- 4. PRODUCT IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- ============================================================
-- 5. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  customer_name TEXT NOT NULL,
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  source TEXT,
  assigned_sale_id UUID REFERENCES profiles(id),
  tax_code TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'NEW'
    CHECK (status IN ('NEW','APPROACHING','CONSULTING','QUOTED','TRACKING','NEGOTIATING','WON','LOST','PAUSED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);

-- ============================================================
-- 6. SALE QUOTATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  quotation_code TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  quotation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','SENT','TRACKING','NEGOTIATING','WON','LOST','EXPIRED')),
  total_amount NUMERIC DEFAULT 0,
  note TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, quotation_code)
);

CREATE INDEX IF NOT EXISTS idx_sq_org ON sale_quotations(organization_id);
CREATE INDEX IF NOT EXISTS idx_sq_customer ON sale_quotations(customer_id);

-- ============================================================
-- 7. SALE QUOTATION ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES sale_quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  image_url TEXT,
  listed_price NUMERIC DEFAULT 0,
  dp_price NUMERIC DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  amount NUMERIC GENERATED ALWAYS AS (quantity * sale_price) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sqi_quotation ON sale_quotation_items(quotation_id);

-- ============================================================
-- 8. QUOTATION TERMS
-- ============================================================
CREATE TABLE IF NOT EXISTS quotation_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES sale_quotations(id) ON DELETE CASCADE,
  term_title TEXT NOT NULL,
  term_content TEXT NOT NULL DEFAULT '',
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qt_quotation ON quotation_terms(quotation_id);

-- ============================================================
-- 9. DEFAULT QUOTATION TERMS (per org)
-- ============================================================
CREATE TABLE IF NOT EXISTS default_quotation_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  term_title TEXT NOT NULL,
  term_content TEXT NOT NULL DEFAULT '',
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dqt_org ON default_quotation_terms(organization_id);

-- ============================================================
-- 10. QUOTATION DISPATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS quotation_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID UNIQUE NOT NULL REFERENCES sale_quotations(id) ON DELETE CASCADE,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_products INTEGER DEFAULT 0,
  sufficient_products INTEGER DEFAULT 0,
  insufficient_products INTEGER DEFAULT 0,
  total_hold_qty INTEGER DEFAULT 0,
  total_order_qty INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. QUOTATION DISPATCH ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS quotation_dispatch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES quotation_dispatches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  ordered_quantity INTEGER DEFAULT 0,
  stock_snapshot INTEGER DEFAULT 0,
  hold_quantity INTEGER DEFAULT 0,
  needed_quantity INTEGER DEFAULT 0,
  status_hold TEXT CHECK (status_hold IS NULL OR status_hold IN ('PENDING','HELD')),
  status_order TEXT CHECK (status_order IS NULL OR status_order IN ('PENDING','REQUESTED','ORDERED','RECEIVED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qdi_dispatch ON quotation_dispatch_items(dispatch_id);

-- ============================================================
-- 12. TRANSACTIONS (Cơ hội bán hàng)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  transaction_code TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  project_name TEXT,
  assigned_sale_id UUID REFERENCES profiles(id),
  expected_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'TRACKING'
    CHECK (status IN ('TRACKING','WON','LOST')),
  rejection_reason TEXT,
  next_action TEXT,
  next_action_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, transaction_code)
);

CREATE INDEX IF NOT EXISTS idx_trx_org ON transactions(organization_id);

-- ============================================================
-- 13. ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('NOTE','CALL','MEETING','EMAIL','QUOTATION','CONTRACT','PAYMENT','SYSTEM')),
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_act_org ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_act_trx ON activities(transaction_id);

-- ============================================================
-- 14. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','STATUS_CHANGE')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_al_org ON audit_logs(organization_id);

-- ============================================================
-- 15. CONTRACTS (Schema sẵn, chưa kết nối UI)
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  contract_code TEXT NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  quotation_id UUID REFERENCES sale_quotations(id),
  customer_id UUID REFERENCES customers(id),
  sign_date TIMESTAMPTZ,
  effective_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  contract_value NUMERIC DEFAULT 0,
  file_url TEXT,
  status TEXT DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','SIGNED','EXPIRED','CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, contract_code)
);

CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(organization_id);

-- ============================================================
-- 16. CONTRACT ITEMS (Schema sẵn, chưa kết nối UI)
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  line_number INTEGER DEFAULT 0,
  product_code TEXT,
  product_name TEXT,
  brand TEXT,
  unit TEXT,
  base_price NUMERIC DEFAULT 0,
  max_discount_rate NUMERIC DEFAULT 0,
  dp_price NUMERIC DEFAULT 0,
  vat_rate NUMERIC DEFAULT 0.08,
  quantity INTEGER DEFAULT 1,
  discount_rate NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  line_subtotal NUMERIC DEFAULT 0,
  line_vat NUMERIC DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ci_contract ON contract_items(contract_id);

-- ============================================================
-- 17. PAYMENTS (Schema sẵn, chưa kết nối UI)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  contract_id UUID REFERENCES contracts(id),
  payment_date TIMESTAMPTZ,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);

-- ============================================================
-- HELPER FUNCTION: Get current user's organization_id
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- FUNCTION: Generate unique document codes
-- ============================================================
CREATE OR REPLACE FUNCTION generate_document_code(
  p_org_id UUID,
  p_prefix TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_date TEXT;
  v_count INTEGER;
BEGIN
  v_date := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYYMMDD');

  IF p_prefix IN ('BG') THEN
    SELECT COUNT(*) + 1 INTO v_count
    FROM sale_quotations
    WHERE organization_id = p_org_id
      AND quotation_code LIKE p_prefix || '-' || v_date || '-%';
  ELSIF p_prefix IN ('TRX') THEN
    SELECT COUNT(*) + 1 INTO v_count
    FROM transactions
    WHERE organization_id = p_org_id
      AND transaction_code LIKE p_prefix || '-' || v_date || '-%';
  ELSIF p_prefix IN ('CT','HD') THEN
    SELECT COUNT(*) + 1 INTO v_count
    FROM contracts
    WHERE organization_id = p_org_id
      AND contract_code LIKE p_prefix || '-' || v_date || '-%';
  ELSE
    v_count := 1;
  END IF;

  RETURN p_prefix || '-' || v_date || '-' || lpad(v_count::text, 3, '0');
END;
$$;

-- ============================================================
-- FUNCTION: Auto-create profile on signup
-- ============================================================
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

-- Trigger: auto-create profile after auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sale_quotations_updated_at BEFORE UPDATE ON sale_quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_quotation_dispatches_updated_at BEFORE UPDATE ON quotation_dispatches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_quotation_dispatch_items_updated_at BEFORE UPDATE ON quotation_dispatch_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_quotation_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_dispatch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS
CREATE POLICY "org_select" ON organizations FOR SELECT USING (id = get_user_org_id());

-- PROFILES
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- PRODUCTS (org-scoped)
CREATE POLICY "products_select" ON products FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "products_update" ON products FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "products_delete" ON products FOR DELETE USING (organization_id = get_user_org_id());

-- PRODUCT IMAGES (via product org)
CREATE POLICY "pi_select" ON product_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND p.organization_id = get_user_org_id()));
CREATE POLICY "pi_insert" ON product_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.organization_id = get_user_org_id()));
CREATE POLICY "pi_delete" ON product_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND p.organization_id = get_user_org_id()));

-- CUSTOMERS (org-scoped)
CREATE POLICY "customers_select" ON customers FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (organization_id = get_user_org_id());

-- SALE QUOTATIONS (org-scoped)
CREATE POLICY "sq_select" ON sale_quotations FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "sq_insert" ON sale_quotations FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "sq_update" ON sale_quotations FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "sq_delete" ON sale_quotations FOR DELETE USING (organization_id = get_user_org_id());

-- SALE QUOTATION ITEMS (via quotation org)
CREATE POLICY "sqi_select" ON sale_quotation_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = sale_quotation_items.quotation_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "sqi_insert" ON sale_quotation_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = quotation_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "sqi_update" ON sale_quotation_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = sale_quotation_items.quotation_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "sqi_delete" ON sale_quotation_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = sale_quotation_items.quotation_id AND sq.organization_id = get_user_org_id()));

-- QUOTATION TERMS (via quotation org)
CREATE POLICY "qt_select" ON quotation_terms FOR SELECT
  USING (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = quotation_terms.quotation_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "qt_insert" ON quotation_terms FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = quotation_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "qt_update" ON quotation_terms FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = quotation_terms.quotation_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "qt_delete" ON quotation_terms FOR DELETE
  USING (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = quotation_terms.quotation_id AND sq.organization_id = get_user_org_id()));

-- DEFAULT QUOTATION TERMS (org-scoped)
CREATE POLICY "dqt_select" ON default_quotation_terms FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "dqt_insert" ON default_quotation_terms FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "dqt_update" ON default_quotation_terms FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "dqt_delete" ON default_quotation_terms FOR DELETE USING (organization_id = get_user_org_id());

-- QUOTATION DISPATCHES (via quotation org)
CREATE POLICY "qd_select" ON quotation_dispatches FOR SELECT
  USING (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = quotation_dispatches.quotation_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "qd_insert" ON quotation_dispatches FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = quotation_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "qd_update" ON quotation_dispatches FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sale_quotations sq WHERE sq.id = quotation_dispatches.quotation_id AND sq.organization_id = get_user_org_id()));

-- QUOTATION DISPATCH ITEMS (via dispatch → quotation org)
CREATE POLICY "qdi_select" ON quotation_dispatch_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM quotation_dispatches qd JOIN sale_quotations sq ON sq.id = qd.quotation_id WHERE qd.id = quotation_dispatch_items.dispatch_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "qdi_insert" ON quotation_dispatch_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM quotation_dispatches qd JOIN sale_quotations sq ON sq.id = qd.quotation_id WHERE qd.id = dispatch_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "qdi_update" ON quotation_dispatch_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM quotation_dispatches qd JOIN sale_quotations sq ON sq.id = qd.quotation_id WHERE qd.id = quotation_dispatch_items.dispatch_id AND sq.organization_id = get_user_org_id()));

-- TRANSACTIONS (org-scoped)
CREATE POLICY "trx_select" ON transactions FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "trx_insert" ON transactions FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "trx_update" ON transactions FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "trx_delete" ON transactions FOR DELETE USING (organization_id = get_user_org_id());

-- ACTIVITIES (org-scoped)
CREATE POLICY "act_select" ON activities FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "act_insert" ON activities FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- AUDIT LOGS (org-scoped)
CREATE POLICY "al_select" ON audit_logs FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "al_insert" ON audit_logs FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- CONTRACTS (org-scoped)
CREATE POLICY "contracts_select" ON contracts FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "contracts_insert" ON contracts FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "contracts_update" ON contracts FOR UPDATE USING (organization_id = get_user_org_id());

-- CONTRACT ITEMS (via contract org)
CREATE POLICY "ci_select" ON contract_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_items.contract_id AND c.organization_id = get_user_org_id()));
CREATE POLICY "ci_insert" ON contract_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_id AND c.organization_id = get_user_org_id()));

-- PAYMENTS (org-scoped)
CREATE POLICY "payments_select" ON payments FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "payments_update" ON payments FOR UPDATE USING (organization_id = get_user_org_id());

-- ============================================================
-- SEED: Initial HHG Holdings Organization
-- ============================================================
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

-- Seed default quotation terms for HHG Holdings
INSERT INTO default_quotation_terms (organization_id, term_title, term_content, display_order, is_visible)
SELECT
  o.id,
  t.term_title,
  t.term_content,
  t.display_order,
  true
FROM organizations o,
(VALUES
  ('Đơn giá', 'Đã bao gồm VAT, chưa bao gồm chi phí lắp đặt. Khối lượng là tạm tính, thanh toán theo khối lượng giao nhận thực tế.', 1),
  ('Thanh toán', 'Đặt cọc 50% giá trị đơn hàng; thanh toán nốt 50% giá trị còn lại trước khi giao hàng.', 2),
  ('Địa chỉ giao hàng', 'Hà Nội.', 3),
  ('Vận chuyển', 'Miễn phí giao hàng đến chân công trình vào thứ 3 và thứ 5 hàng tuần trong nội thành Hà Nội.', 4),
  ('Tiến độ giao hàng', E'Lần 1: giao phần hàng có sẵn sau 5–7 ngày từ ngày nhận tạm ứng.\nLần 2: giao phần còn lại sau 120–150 ngày kể từ ngày nhận tạm ứng.', 5),
  ('Bảo hành', 'Bảo hành 24 tháng chính hãng theo tiêu chuẩn của nhà sản xuất.', 6)
) AS t(term_title, term_content, display_order)
WHERE o.slug = 'hhg-holdings'
AND NOT EXISTS (SELECT 1 FROM default_quotation_terms WHERE organization_id = o.id);

-- ============================================================
-- SUPABASE STORAGE: Product Images Bucket
-- ============================================================
-- Run this manually in Storage settings or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Done!
SELECT 'Migration script completed successfully!' as status;
