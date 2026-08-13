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
}

// --- Project ---
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Project extends BaseEntity {
  project_name: string;
  customer_id: string;
  location?: string;
  investor?: string;
  contact_person?: string;
  project_progress?: string;
  expected_delivery_date?: string;
  notes?: string;
  status: ProjectStatus;
}

// --- Opportunity ---
export type OpportunityStatus =
  | 'LEAD'
  | 'CONSULTING'
  | 'QUOTING'
  | 'SENT'
  | 'NEGOTIATING'
  | 'WON'
  | 'LOST';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Opportunity extends BaseEntity {
  opportunity_code: string;
  customer_id: string;
  project_id?: string;
  assigned_sale_id: string;
  received_date: string;
  expected_close_date?: string;
  requirements?: string;
  estimated_value?: number;
  priority: Priority;
  status: OpportunityStatus;
  rejection_reason_id?: string;
  rejection_notes?: string;
  rejection_date?: string;
  last_quotation_value?: number;
  notes?: string;
}

// --- Rejection Reason ---
export interface RejectionReason {
  id: string;
  reason_name: string;
  sort_order: number;
  is_active: boolean;
}

// --- Quotation ---
export type QuotationVersionStatus = 'DRAFT' | 'CURRENT' | 'REPLACED' | 'CANCELLED';

export interface Quotation extends BaseEntity {
  quotation_code: string;
  opportunity_id: string;
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
  // Stock info at quote time
  stock_at_quote?: number;
  available_at_quote?: number;
  // Flags
  discount_exceeded: boolean;
  stock_warning?: 'AVAILABLE' | 'LOW' | 'OUT_OF_STOCK';
  notes?: string;
  created_at: string;
}

// --- Order ---
export type StockStatus = 'PENDING' | 'PARTIALLY_RESERVED' | 'FULLY_RESERVED';
export type ContractStatus = 'PENDING' | 'SIGNED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type DeliveryStatus = 'PENDING' | 'PREPARING' | 'PARTIAL' | 'DELIVERED';
export type OrderOverallStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Order extends BaseEntity {
  order_code: string;
  opportunity_id: string;
  customer_id: string;
  project_id?: string;
  quotation_id: string;
  quotation_version_id: string;
  assigned_sale_id: string;
  order_date: string;
  total_amount: number;
  stock_status: StockStatus;
  contract_status: ContractStatus;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  overall_status: OrderOverallStatus;
  notes?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quotation_item_id?: string;
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
  reserved_quantity: number;
  need_to_order: number;
  delivered_quantity: number;
  remaining_quantity: number;
  created_at: string;
}

// --- Contract ---
export type ContractDocStatus = 'DRAFT' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';

export interface Contract extends BaseEntity {
  contract_code: string;
  order_id: string;
  sign_date?: string;
  effective_date?: string;
  expiry_date?: string;
  contract_value: number;
  file_url?: string;
  status: ContractDocStatus;
  notes?: string;
}

// --- Payment ---
export type PaymentScheduleStatus = 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'PAID';

export interface PaymentSchedule {
  id: string;
  order_id: string;
  installment_number: number;
  payment_condition?: string;
  percentage: number;
  expected_date: string;
  expected_amount: number;
  actual_date?: string;
  actual_amount: number;
  status: PaymentScheduleStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_schedule_id: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

// --- Delivery ---
export type DeliveryItemStatus = 'PENDING' | 'PREPARING' | 'PARTIAL' | 'DELIVERED';

export interface DeliveryItem {
  id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  product_code: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_delivered: number;
  quantity_remaining: number;
  status: DeliveryItemStatus;
  delivery_date?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Procurement ---
export type ProcurementStatus =
  | 'NOT_ORDERED'
  | 'ORDERED'
  | 'IN_PRODUCTION'
  | 'SHIPPING'
  | 'CUSTOMS'
  | 'CLEARED'
  | 'RECEIVED';

export interface ProcurementItem {
  id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  product_code: string;
  quantity_needed: number;
  supplier?: string;
  request_date?: string;
  order_date?: string;
  po_number?: string;
  eta?: string;
  shipping_status?: string;
  customs_status?: string;
  expected_arrival_date?: string;
  actual_arrival_date?: string;
  status: ProcurementStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Inventory Transaction ---
export type InventoryTransactionType = 'IMPORT' | 'EXPORT' | 'RESERVE' | 'RELEASE' | 'ADJUST';

export interface InventoryTransaction {
  id: string;
  product_id: string;
  transaction_type: InventoryTransactionType;
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
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
