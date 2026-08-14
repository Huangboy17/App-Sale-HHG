// ============================================================
// Sales Management Application - Type Definitions
// ============================================================

// --- Base Types ---
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// --- User & Auth ---
export type UserRole = 'ADMIN' | 'SALE' | 'SALES_MANAGER' | 'ACCOUNTING' | 'WAREHOUSE' | 'MANAGER';

export interface User extends BaseEntity {
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
}

// --- Product Master ---
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

export interface Product extends BaseEntity {
  product_code: string;
  product_name: string;
  brand: string;
  product_group: string;
  unit: string;
  base_price: number;
  max_discount_rate: number; // 0.15 = 15%
  dp_price: number; // computed: base_price * (1 - max_discount_rate)
  vat_rate: number; // 0.08 = 8%
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number; // computed: stock_quantity - reserved_quantity
  status: ProductStatus;
  description?: string;
}

// --- Customer ---
export type CustomerStatus = 'NEW' | 'APPROACHING' | 'CONSULTING' | 'QUOTED' | 'TRACKING' | 'NEGOTIATING' | 'WON' | 'LOST' | 'PAUSED';

export interface Customer extends BaseEntity {
  customer_name: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  source?: string;
  assigned_sale_id?: string;
  tax_code?: string;
  notes?: string;
  is_active: boolean;
  status: CustomerStatus;
}

// --- Transaction ---
export type TransactionStatus = 'TRACKING' | 'WON' | 'LOST';

export interface Transaction extends BaseEntity {
  transaction_code: string;
  customer_id: string;
  project_name: string;
  assigned_sale_id: string;
  expected_value: number;
  status: TransactionStatus;
  rejection_reason?: string;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
}

// --- Activity Timeline ---
export type ActivityType = 'NOTE' | 'CALL' | 'MEETING' | 'EMAIL' | 'QUOTATION' | 'CONTRACT' | 'PAYMENT' | 'SYSTEM';

export interface Activity extends BaseEntity {
  transaction_id: string;
  activity_type: ActivityType;
  description: string;
  created_by: string;
}

// --- Quotation ---
export type QuotationVersionStatus = 'DRAFT' | 'CURRENT' | 'REPLACED' | 'CANCELLED';

export interface Quotation extends BaseEntity {
  quotation_code: string;
  transaction_id: string;
  created_by: string;
  notes?: string;
}

export interface QuotationVersion extends BaseEntity {
  quotation_id: string;
  version_number: number;
  status: QuotationVersionStatus;
  payment_terms?: string;
  delivery_terms?: string;
  validity_period: number;
  validity_date?: string;
  subtotal: number;
  total_vat: number;
  total_amount: number;
  notes?: string;
  created_by: string;
}

export interface QuotationItem {
  id: string;
  quotation_version_id: string;
  product_id: string;
  line_number: number;
  // Snapshot
  product_code: string;
  product_name: string;
  brand: string;
  unit: string;
  base_price: number;
  max_discount_rate: number;
  dp_price: number;
  vat_rate: number;
  // Sale input
  quantity: number;
  discount_rate: number;
  // Computed
  unit_price: number;
  line_subtotal: number;
  line_vat: number;
  line_total: number;
  // Flags
  notes?: string;
  created_at: string;
}

// --- Contract ---
export type ContractStatus = 'DRAFT' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';

export interface Contract extends BaseEntity {
  contract_code: string;
  transaction_id: string;
  quotation_version_id: string;
  customer_id: string;
  sign_date?: string;
  effective_date?: string;
  expiry_date?: string;
  contract_value: number;
  file_url?: string;
  status: ContractStatus;
  notes?: string;
}

export interface ContractItem {
  id: string;
  contract_id: string;
  product_id: string;
  line_number: number;
  // Snapshot
  product_code: string;
  product_name: string;
  brand: string;
  unit: string;
  base_price: number;
  max_discount_rate: number;
  dp_price: number;
  vat_rate: number;
  // Sale input
  quantity: number;
  discount_rate: number;
  // Computed
  unit_price: number;
  line_subtotal: number;
  line_vat: number;
  line_total: number;
  created_at: string;
}

// --- Order ---
export type OrderOverallStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Order extends BaseEntity {
  order_code: string;
  contract_id?: string;
  transaction_id: string;
  customer_id: string;
  order_date: string;
  total_amount: number;
  overall_status: OrderOverallStatus;
  notes?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  contract_item_id?: string;
  line_number: number;
  product_code: string;
  product_name: string;
  brand: string;
  unit: string;
  quantity: number;
  discount_rate: number;
  unit_price: number;
  vat_rate: number;
  line_subtotal: number;
  line_vat: number;
  line_total: number;
  delivered_quantity: number;
  remaining_quantity: number;
  created_at: string;
}

// --- Payment ---
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface Payment extends BaseEntity {
  contract_id: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
}

// --- Inventory Transaction ---
export type InventoryTransactionType = 'IMPORT' | 'EXPORT' | 'RESERVE' | 'RELEASE' | 'ADJUST';

export interface InventoryTransaction extends BaseEntity {
  product_id: string;
  transaction_type: InventoryTransactionType;
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by?: string;
}

// --- Opportunity (compatibility with existing stores) ---
export type OpportunityStatus = 'LEAD' | 'CONSULTING' | 'QUOTING' | 'SENT' | 'NEGOTIATING' | 'WON' | 'LOST';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Opportunity extends BaseEntity {
  opportunity_code: string;
  customer_id: string;
  project_id?: string;
  estimated_value: number;
  status: OpportunityStatus;
  priority: Priority;
  received_date: string;
  expected_close_date?: string;
  requirements?: string;
  rejection_reason_id?: string;
  rejection_notes?: string;
  assigned_sale_id?: string;
  notes?: string;
}

// --- Project (compatibility with existing stores) ---
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Project extends BaseEntity {
  project_name: string;
  customer_id: string;
  status: ProjectStatus;
  location?: string;
  investor?: string;
  contact_person?: string;
  project_progress?: string;
  expected_delivery_date?: string;
  notes?: string;
  description?: string;
}

// --- Audit Log ---
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// --- UI Helper Types ---
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'daterange';
  options?: SelectOption[];
}

export interface DashboardKPI {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: string;
  color?: string;
}

// --- Sale Quotation (Customer-linked, independent per quotation) ---
export type SaleQuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'TRACKING'
  | 'NEGOTIATING'
  | 'WON'
  | 'LOST'
  | 'EXPIRED';

export interface QuotationTerm {
  id: string;
  quotation_id?: string;
  term_number?: number;
  term_title: string;
  term_content: string;
  display_order: number;
  is_visible: boolean;
}

export interface SaleQuotation extends BaseEntity {
  quotation_code: string;
  customer_id: string;
  quotation_date: string;
  status: SaleQuotationStatus;
  total_amount: number;
  note?: string;
  terms?: QuotationTerm[];
  created_by?: string;
}

export interface SaleQuotationItem {
  id: string;
  quotation_id: string;
  product_id: string;
  // Snapshot sản phẩm tại thời điểm tạo báo giá
  product_code: string;
  product_name: string;
  brand: string;
  unit: string;
  // Snapshot giá tại thời điểm tạo báo giá
  listed_price: number; // Giá NY sau VAT
  dp_price: number;     // Giá DP
  // Sale input
  quantity: number;
  sale_price: number;
  note?: string;        // Ghi chú từng dòng sản phẩm
  // Computed
  amount: number;       // quantity × sale_price
}

// --- Sale Quotation Dispatch (Hold & Order after WON) ---
export type HoldStatus = 'PENDING' | 'HELD';
export type OrderStatus = 'PENDING' | 'REQUESTED' | 'ORDERED' | 'RECEIVED';

export interface QuotationDispatchItem {
  id: string;
  quotation_id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  brand: string;
  unit: string;
  ordered_quantity: number;        // SL khách đặt
  stock_snapshot: number;          // Tồn kho tại thời điểm chốt
  hold_quantity: number;           // SL giữ hàng (có sẵn)
  needed_quantity: number;         // SL cần đặt thêm
  status_hold?: HoldStatus;        // Trạng thái giữ hàng
  status_order?: OrderStatus;      // Trạng thái đặt hàng
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationDispatchSummary {
  quotation_id: string;
  closed_at: string;               // Ngày chốt
  total_products: number;          // Tổng số mặt hàng
  sufficient_products: number;     // Số mặt hàng đủ hàng
  insufficient_products: number;   // Số mặt hàng thiếu hàng
  total_hold_qty: number;          // Tổng SL giữ hàng
  total_order_qty: number;         // Tổng SL cần đặt
  items: QuotationDispatchItem[];
}

