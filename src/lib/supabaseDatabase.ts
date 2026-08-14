// ============================================================
// Supabase Database Abstraction Layer
// Replaces localStorage-based database.ts for Supabase mode
// ============================================================

import { supabase } from './supabaseClient';
import type {
  User, Product, Customer,
  SaleQuotation, SaleQuotationItem,
  QuotationDispatchSummary, QuotationDispatchItem, QuotationTerm,
  AuditLog
} from './types';

// ============================================================
// HELPER: Get current user's organization_id from profile
// ============================================================
let _cachedOrgId: string | null = null;

export async function getOrganizationId(): Promise<string> {
  if (_cachedOrgId) return _cachedOrgId;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (error || !profile) throw new Error('Profile not found');
  _cachedOrgId = profile.organization_id;
  return _cachedOrgId!;
}

export function clearOrgCache(): void {
  _cachedOrgId = null;
}

// ============================================================
// AUTH
// ============================================================
export async function supabaseSignUp(
  email: string,
  password: string,
  fullName: string,
  organizationId?: string,
  role: string = 'SALE'
) {
  const metadata: Record<string, any> = {
    full_name: fullName,
    role,
  };
  if (organizationId && organizationId.trim()) {
    metadata.organization_id = organizationId.trim();
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

export async function supabaseSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function supabaseSignOut() {
  clearOrgCache();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function supabaseGetSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function supabaseGetCurrentProfile(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // If trigger did not run yet or profile doesn't exist, create it on-the-fly
    try {
      const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
      const defaultOrgId = orgs?.[0]?.id;

      if (defaultOrgId) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            organization_id: defaultOrgId,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email!,
            role: user.user_metadata?.role || 'SALE',
          })
          .select()
          .single();
        profile = newProfile;
      }
    } catch (e) {
      console.warn('Fallback profile creation failed:', e);
    }
  }

  if (!profile) return null;

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone || undefined,
    role: profile.role,
    avatar_url: profile.avatar_url || undefined,
    is_active: profile.is_active,
    organization_id: profile.organization_id || undefined,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  } as User;
}

// ============================================================
// ORGANIZATION
// ============================================================
export async function getOrganization() {
  const orgId = await getOrganizationId();
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  if (error) throw error;
  return data;
}

export async function getOrganizationBySlug(slug: string) {
  // This is for signup — needs to be accessible without auth
  // Use a special RPC or make organizations readable
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data;
}

// ============================================================
// USERS / PROFILES
// ============================================================
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');
  if (error) throw error;
  return (data || []).map(mapProfileToUser);
}

export async function getUser(id: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return undefined;
  return mapProfileToUser(data);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
  if (error || !data) return undefined;
  return mapProfileToUser(data);
}

function mapProfileToUser(profile: any): User {
  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone || undefined,
    role: profile.role,
    avatar_url: profile.avatar_url || undefined,
    is_active: profile.is_active,
    organization_id: profile.organization_id || undefined,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  } as User;
}

// ============================================================
// PRODUCTS
// ============================================================
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('product_code');
  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function getProductByCode(code: string): Promise<Product | undefined> {
  const orgId = await getOrganizationId();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', orgId)
    .eq('product_code', code)
    .single();
  if (error || !data) return undefined;
  return mapProduct(data);
}

export async function createProduct(productData: any): Promise<Product> {
  const orgId = await getOrganizationId();
  const { data, error } = await supabase
    .from('products')
    .insert({
      organization_id: orgId,
      product_code: productData.product_code,
      product_name: productData.product_name,
      brand: productData.brand || '',
      product_group: productData.product_group || '',
      unit: productData.unit || 'Cái',
      base_price: productData.base_price || 0,
      max_discount_rate: productData.max_discount_rate || 0,
      dp_price: productData.dp_price || 0,
      vat_rate: productData.vat_rate ?? 0.08,
      stock_quantity: productData.stock_quantity || 0,
      reserved_quantity: productData.reserved_quantity || 0,
      status: productData.status || 'ACTIVE',
      description: productData.description || null,
      image_url: productData.image_url || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const cleanUpdates: Record<string, any> = {};
  const allowedFields = [
    'product_code', 'product_name', 'brand', 'product_group', 'unit',
    'base_price', 'max_discount_rate', 'dp_price', 'vat_rate',
    'stock_quantity', 'reserved_quantity', 'status', 'description', 'image_url'
  ];
  for (const key of allowedFields) {
    if (key in updates) {
      cleanUpdates[key] = (updates as any)[key];
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data);
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    product_code: row.product_code,
    product_name: row.product_name,
    brand: row.brand || '',
    product_group: row.product_group || '',
    unit: row.unit || 'Cái',
    base_price: Number(row.base_price) || 0,
    max_discount_rate: Number(row.max_discount_rate) || 0,
    dp_price: Number(row.dp_price) || 0,
    vat_rate: Number(row.vat_rate) ?? 0.08,
    stock_quantity: Number(row.stock_quantity) || 0,
    reserved_quantity: Number(row.reserved_quantity) || 0,
    available_quantity: (Number(row.stock_quantity) || 0) - (Number(row.reserved_quantity) || 0),
    status: row.status || 'ACTIVE',
    description: row.description || undefined,
    image_url: row.image_url || undefined,
    images: [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as Product;
}

// ============================================================
// CUSTOMERS
// ============================================================
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('customer_name');
  if (error) throw error;
  return (data || []).map(mapCustomer);
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return undefined;
  return mapCustomer(data);
}

export async function createCustomer(customerData: any): Promise<Customer> {
  const orgId = await getOrganizationId();
  const { data, error } = await supabase
    .from('customers')
    .insert({
      organization_id: orgId,
      customer_name: customerData.customer_name,
      company_name: customerData.company_name || null,
      contact_person: customerData.contact_person || null,
      phone: customerData.phone || null,
      email: customerData.email || null,
      address: customerData.address || null,
      source: customerData.source || null,
      assigned_sale_id: customerData.assigned_sale_id || null,
      tax_code: customerData.tax_code || null,
      notes: customerData.notes || null,
      status: customerData.status || 'NEW',
    })
    .select()
    .single();
  if (error) throw error;
  return mapCustomer(data);
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const cleanUpdates: Record<string, any> = {};
  const allowedFields = [
    'customer_name', 'company_name', 'contact_person', 'phone', 'email',
    'address', 'source', 'assigned_sale_id', 'tax_code', 'notes', 'status'
  ];
  for (const key of allowedFields) {
    if (key in updates) {
      cleanUpdates[key] = (updates as any)[key];
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapCustomer(data);
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function mapCustomer(row: any): Customer {
  return {
    id: row.id,
    customer_name: row.customer_name,
    company_name: row.company_name || undefined,
    contact_person: row.contact_person || undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    address: row.address || undefined,
    source: row.source || undefined,
    assigned_sale_id: row.assigned_sale_id || undefined,
    tax_code: row.tax_code || undefined,
    notes: row.notes || undefined,
    status: row.status || 'NEW',
    is_active: row.is_active ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as Customer;
}

// ============================================================
// SALE QUOTATIONS
// ============================================================
export async function getSaleQuotations(): Promise<SaleQuotation[]> {
  const { data, error } = await supabase
    .from('sale_quotations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapSaleQuotation);
}

export async function getSaleQuotationsByCustomer(customerId: string): Promise<SaleQuotation[]> {
  const { data, error } = await supabase
    .from('sale_quotations')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  // For each quotation, load its terms
  const quotations = (data || []).map(mapSaleQuotation);
  for (const q of quotations) {
    const terms = await getQuotationTerms(q.id);
    (q as any).terms = terms;
  }
  return quotations;
}

export async function createSaleQuotation(
  quotationData: Omit<SaleQuotation, 'id' | 'created_at' | 'updated_at'>
): Promise<SaleQuotation> {
  const orgId = await getOrganizationId();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('sale_quotations')
    .insert({
      organization_id: orgId,
      quotation_code: quotationData.quotation_code,
      customer_id: quotationData.customer_id,
      quotation_date: quotationData.quotation_date,
      status: quotationData.status || 'DRAFT',
      total_amount: quotationData.total_amount || 0,
      note: quotationData.note || null,
      created_by: user?.id || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSaleQuotation(data);
}

export async function updateSaleQuotation(id: string, updates: Partial<SaleQuotation>): Promise<SaleQuotation> {
  const cleanUpdates: Record<string, any> = {};
  const allowedFields = ['status', 'total_amount', 'note', 'quotation_date'];
  for (const key of allowedFields) {
    if (key in updates) {
      cleanUpdates[key] = (updates as any)[key];
    }
  }

  const { data, error } = await supabase
    .from('sale_quotations')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapSaleQuotation(data);
}

export async function generateSaleQuotationCode(): Promise<string> {
  const orgId = await getOrganizationId();
  const { data, error } = await supabase.rpc('generate_document_code', {
    p_org_id: orgId,
    p_prefix: 'BG',
  });
  if (error) throw error;
  return data as string;
}

function mapSaleQuotation(row: any): SaleQuotation {
  return {
    id: row.id,
    quotation_code: row.quotation_code,
    customer_id: row.customer_id,
    quotation_date: row.quotation_date,
    status: row.status || 'DRAFT',
    total_amount: Number(row.total_amount) || 0,
    note: row.note || undefined,
    terms: [], // Will be loaded separately
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as SaleQuotation;
}

// ============================================================
// SALE QUOTATION ITEMS
// ============================================================
export async function getSaleQuotationItems(quotationId: string): Promise<SaleQuotationItem[]> {
  const { data, error } = await supabase
    .from('sale_quotation_items')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('created_at');
  if (error) throw error;
  return (data || []).map(mapSaleQuotationItem);
}

export async function setSaleQuotationItems(
  quotationId: string,
  items: SaleQuotationItem[]
): Promise<void> {
  // Delete existing items first
  const { error: deleteError } = await supabase
    .from('sale_quotation_items')
    .delete()
    .eq('quotation_id', quotationId);
  if (deleteError) throw deleteError;

  if (items.length === 0) return;

  // Insert new items
  const rows = items.map((item) => ({
    id: item.id || undefined,
    quotation_id: quotationId,
    product_id: item.product_id || null,
    product_code: item.product_code,
    product_name: item.product_name,
    brand: item.brand || '',
    unit: item.unit || '',
    image_url: item.image_url || null,
    listed_price: item.listed_price || 0,
    dp_price: item.dp_price || 0,
    quantity: item.quantity,
    sale_price: item.sale_price,
    note: item.note || null,
  }));

  const { error: insertError } = await supabase
    .from('sale_quotation_items')
    .insert(rows);
  if (insertError) throw insertError;
}

function mapSaleQuotationItem(row: any): SaleQuotationItem {
  return {
    id: row.id,
    quotation_id: row.quotation_id,
    product_id: row.product_id || undefined,
    product_code: row.product_code,
    product_name: row.product_name,
    brand: row.brand || '',
    unit: row.unit || '',
    image_url: row.image_url || undefined,
    listed_price: Number(row.listed_price) || 0,
    dp_price: Number(row.dp_price) || 0,
    quantity: Number(row.quantity) || 0,
    sale_price: Number(row.sale_price) || 0,
    note: row.note || undefined,
    amount: Number(row.amount) || (Number(row.quantity) * Number(row.sale_price)),
  } as SaleQuotationItem;
}

// ============================================================
// QUOTATION TERMS
// ============================================================
export async function getQuotationTerms(quotationId: string): Promise<QuotationTerm[]> {
  const { data, error } = await supabase
    .from('quotation_terms')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('display_order');
  if (error) throw error;
  return (data || []).map(mapQuotationTerm);
}

export async function setQuotationTerms(
  quotationId: string,
  terms: QuotationTerm[]
): Promise<void> {
  // Delete existing
  await supabase.from('quotation_terms').delete().eq('quotation_id', quotationId);

  if (terms.length === 0) return;

  const rows = terms.map((t) => ({
    quotation_id: quotationId,
    term_title: t.term_title,
    term_content: t.term_content,
    display_order: t.display_order,
    is_visible: t.is_visible ?? true,
  }));

  const { error } = await supabase.from('quotation_terms').insert(rows);
  if (error) throw error;
}

export async function getDefaultQuotationTerms(): Promise<QuotationTerm[]> {
  const { data, error } = await supabase
    .from('default_quotation_terms')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return (data || []).map(mapQuotationTerm);
}

function mapQuotationTerm(row: any): QuotationTerm {
  return {
    id: row.id,
    term_title: row.term_title,
    term_content: row.term_content,
    display_order: row.display_order,
    is_visible: row.is_visible ?? true,
  };
}

// ============================================================
// QUOTATION DISPATCH (Giữ hàng / Đặt hàng)
// ============================================================
export async function getSaleQuotationDispatch(
  quotationId: string
): Promise<QuotationDispatchSummary | null> {
  const { data: dispatch, error } = await supabase
    .from('quotation_dispatches')
    .select('*')
    .eq('quotation_id', quotationId)
    .single();
  if (error || !dispatch) return null;

  const { data: items } = await supabase
    .from('quotation_dispatch_items')
    .select('*')
    .eq('dispatch_id', dispatch.id)
    .order('created_at');

  return {
    quotation_id: dispatch.quotation_id,
    closed_at: dispatch.closed_at,
    total_products: dispatch.total_products,
    sufficient_products: dispatch.sufficient_products,
    insufficient_products: dispatch.insufficient_products,
    total_hold_qty: dispatch.total_hold_qty,
    total_order_qty: dispatch.total_order_qty,
    items: (items || []).map(mapDispatchItem),
    created_at: dispatch.created_at,
    updated_at: dispatch.updated_at,
  } as QuotationDispatchSummary;
}

export async function createOrUpdateQuotationDispatch(
  quotationId: string,
  forceRecreate = false
): Promise<QuotationDispatchSummary | null> {
  // Get quotation items
  const quotationItems = await getSaleQuotationItems(quotationId);
  if (quotationItems.length === 0) return null;

  // Get current products for stock snapshot
  const products = await getProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Check if dispatch already exists
  const existingDispatch = await getSaleQuotationDispatch(quotationId);
  if (existingDispatch && !forceRecreate) return existingDispatch;

  // Delete existing if force recreate
  if (existingDispatch) {
    const { data: existingRow } = await supabase
      .from('quotation_dispatches')
      .select('id')
      .eq('quotation_id', quotationId)
      .single();
    if (existingRow) {
      await supabase.from('quotation_dispatch_items').delete().eq('dispatch_id', existingRow.id);
      await supabase.from('quotation_dispatches').delete().eq('id', existingRow.id);
    }
  }

  // Build dispatch items
  const now = new Date().toISOString();
  let totalProducts = 0;
  let sufficientProducts = 0;
  let insufficientProducts = 0;
  let totalHoldQty = 0;
  let totalOrderQty = 0;

  const dispatchItems: any[] = [];

  for (const item of quotationItems) {
    const product = item.product_id ? productMap.get(item.product_id) : null;
    const stockSnapshot = product?.stock_quantity ?? 0;
    const orderedQty = item.quantity;
    const holdQty = Math.min(orderedQty, Math.max(0, stockSnapshot));
    const neededQty = Math.max(0, orderedQty - holdQty);

    totalProducts++;
    if (neededQty === 0) sufficientProducts++;
    else insufficientProducts++;
    totalHoldQty += holdQty;
    totalOrderQty += neededQty;

    dispatchItems.push({
      product_id: item.product_id || null,
      product_code: item.product_code,
      product_name: item.product_name,
      brand: item.brand || '',
      unit: item.unit || '',
      ordered_quantity: orderedQty,
      stock_snapshot: stockSnapshot,
      hold_quantity: holdQty,
      needed_quantity: neededQty,
      status_hold: holdQty > 0 ? 'PENDING' : null,
      status_order: neededQty > 0 ? 'PENDING' : null,
    });
  }

  // Insert dispatch summary
  const { data: newDispatch, error: dispatchError } = await supabase
    .from('quotation_dispatches')
    .insert({
      quotation_id: quotationId,
      closed_at: now,
      total_products: totalProducts,
      sufficient_products: sufficientProducts,
      insufficient_products: insufficientProducts,
      total_hold_qty: totalHoldQty,
      total_order_qty: totalOrderQty,
    })
    .select()
    .single();
  if (dispatchError) throw dispatchError;

  // Insert dispatch items
  const itemRows = dispatchItems.map((item) => ({
    dispatch_id: newDispatch.id,
    ...item,
  }));
  const { error: itemsError } = await supabase
    .from('quotation_dispatch_items')
    .insert(itemRows);
  if (itemsError) throw itemsError;

  return getSaleQuotationDispatch(quotationId);
}

export async function saveSaleQuotationDispatch(
  summary: QuotationDispatchSummary
): Promise<void> {
  // Update summary
  const { data: dispatch } = await supabase
    .from('quotation_dispatches')
    .select('id')
    .eq('quotation_id', summary.quotation_id)
    .single();

  if (!dispatch) return;

  await supabase
    .from('quotation_dispatches')
    .update({
      total_hold_qty: summary.total_hold_qty,
      total_order_qty: summary.total_order_qty,
    })
    .eq('id', dispatch.id);

  // Update each item
  for (const item of summary.items) {
    await supabase
      .from('quotation_dispatch_items')
      .update({
        status_hold: item.status_hold,
        status_order: item.status_order,
        notes: item.notes || null,
      })
      .eq('id', item.id);
  }
}

function mapDispatchItem(row: any): QuotationDispatchItem {
  return {
    id: row.id,
    product_id: row.product_id || undefined,
    product_code: row.product_code,
    product_name: row.product_name,
    brand: row.brand || '',
    unit: row.unit || '',
    ordered_quantity: Number(row.ordered_quantity) || 0,
    stock_snapshot: Number(row.stock_snapshot) || 0,
    hold_quantity: Number(row.hold_quantity) || 0,
    needed_quantity: Number(row.needed_quantity) || 0,
    status_hold: row.status_hold || undefined,
    status_order: row.status_order || undefined,
    notes: row.notes || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as QuotationDispatchItem;
}

// ============================================================
// TRANSACTIONS (Opportunities)
// ============================================================
export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTransaction(txData: any) {
  const orgId = await getOrganizationId();
  const { data, error } = await supabase
    .from('transactions')
    .insert({ organization_id: orgId, ...txData })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(id: string, updates: any) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// ACTIVITIES
// ============================================================
export async function getActivitiesByTransaction(transactionId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createActivity(actData: any) {
  const orgId = await getOrganizationId();
  const { data, error } = await supabase
    .from('activities')
    .insert({ organization_id: orgId, ...actData })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// AUDIT LOG
// ============================================================
export async function addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
  const orgId = await getOrganizationId();
  await supabase.from('audit_logs').insert({
    organization_id: orgId,
    user_id: log.user_id || null,
    user_name: log.user_name || null,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    field_name: log.field_name || null,
    old_value: log.old_value || null,
    new_value: log.new_value || null,
    metadata: log.metadata || null,
  });
}
