// ============================================================
// Constants & Enums for Sales Management Application
// ============================================================

import type { UserRole, SelectOption } from './types';

// --- Opportunity Status Labels ---
export const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  CONSULTING: 'Đang tư vấn',
  QUOTING: 'Đang báo giá',
  SENT: 'Đã gửi báo giá',
  NEGOTIATING: 'Đang đàm phán',
  WON: 'Chốt',
  LOST: 'Từ chối',
};

export const OPPORTUNITY_STATUS_COLORS: Record<string, string> = {
  LEAD: 'var(--status-lead)',
  CONSULTING: 'var(--status-consulting)',
  QUOTING: 'var(--status-quoting)',
  SENT: 'var(--status-sent)',
  NEGOTIATING: 'var(--status-negotiating)',
  WON: 'var(--status-won)',
  LOST: 'var(--status-lost)',
};

export const OPPORTUNITY_STATUS_ORDER = [
  'LEAD', 'CONSULTING', 'QUOTING', 'SENT', 'NEGOTIATING', 'WON', 'LOST'
] as const;

// --- Priority Labels ---
export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'var(--priority-low)',
  MEDIUM: 'var(--priority-medium)',
  HIGH: 'var(--priority-high)',
  URGENT: 'var(--priority-urgent)',
};

// --- Product Status ---
export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang kinh doanh',
  INACTIVE: 'Ngừng KD',
  DISCONTINUED: 'Ngừng sản xuất',
};

// --- Customer Status ---
export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  NEW: 'Khách hàng mới',
  APPROACHING: 'Đang tiếp cận',
  CONSULTING: 'Đang tư vấn',
  QUOTED: 'Đã gửi báo giá',
  TRACKING: 'Đang theo dõi',
  NEGOTIATING: 'Đang đàm phán',
  WON: 'Đã chốt',
  LOST: 'Không chốt',
  PAUSED: 'Tạm dừng',
};

export const CUSTOMER_STATUS_COLORS: Record<string, string> = {
  NEW: 'info',
  APPROACHING: 'info',
  CONSULTING: 'warning',
  QUOTED: 'warning',
  TRACKING: 'info',
  NEGOTIATING: 'warning',
  WON: 'success',
  LOST: 'danger',
  PAUSED: 'default',
};

export const CUSTOMER_STATUS_ORDER = [
  'NEW', 'APPROACHING', 'CONSULTING', 'QUOTED', 'TRACKING', 'NEGOTIATING', 'WON', 'LOST', 'PAUSED'
] as const;

// --- Order Status ---
export const ORDER_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

// --- Payment Status ---
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UPCOMING: 'Chưa đến hạn',
  DUE_SOON: 'Sắp đến hạn',
  OVERDUE: 'Quá hạn',
  PAID: 'Đã thu',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'var(--color-info)',
  DUE_SOON: 'var(--color-warning)',
  OVERDUE: 'var(--color-danger)',
  PAID: 'var(--color-success)',
};

// --- Delivery Status ---
export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chưa giao',
  PREPARING: 'Đang chuẩn bị',
  PARTIAL: 'Đã giao một phần',
  DELIVERED: 'Đã giao đủ',
};

// --- Procurement Status ---
export const PROCUREMENT_STATUS_LABELS: Record<string, string> = {
  NOT_ORDERED: 'Chưa đặt',
  ORDERED: 'Đã đặt',
  IN_PRODUCTION: 'Đang sản xuất',
  SHIPPING: 'Đang vận chuyển',
  CUSTOMS: 'Hải quan',
  CLEARED: 'Đã thông quan',
  RECEIVED: 'Đã về kho',
};

// --- Quotation Version Status ---
export const QUOTATION_VERSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  CURRENT: 'Hiện hành',
  REPLACED: 'Đã thay thế',
  CANCELLED: 'Đã hủy',
};

// --- Project Status ---
export const PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang triển khai',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

// --- Role Labels & Permissions ---
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  SALE: 'Nhân viên Sale',
  SALES_MANAGER: 'Trưởng nhóm Sale',
  ACCOUNTING: 'Kế toán',
  WAREHOUSE: 'Kho',
  MANAGER: 'Quản lý',
};

export interface Permission {
  canCreateCustomer: boolean;
  canCreateOpportunity: boolean;
  canCreateQuotation: boolean;
  canEditBasePrice: boolean;
  canEditMaxDiscount: boolean;
  canEditDpPrice: boolean;
  canEditStock: boolean;
  canViewInternalPricing: boolean;
  canViewAllOpportunities: boolean;
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canUpdatePayment: boolean;
  canUpdateDelivery: boolean;
  canApproveDiscount: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  ADMIN: {
    canCreateCustomer: true,
    canCreateOpportunity: true,
    canCreateQuotation: true,
    canEditBasePrice: true,
    canEditMaxDiscount: true,
    canEditDpPrice: true,
    canEditStock: true,
    canViewInternalPricing: true,
    canViewAllOpportunities: true,
    canViewDashboard: true,
    canManageUsers: true,
    canUpdatePayment: true,
    canUpdateDelivery: true,
    canApproveDiscount: true,
  },
  SALE: {
    canCreateCustomer: true,
    canCreateOpportunity: true,
    canCreateQuotation: true,
    canEditBasePrice: false,
    canEditMaxDiscount: false,
    canEditDpPrice: false,
    canEditStock: false,
    canViewInternalPricing: true,
    canViewAllOpportunities: false,
    canViewDashboard: true,
    canManageUsers: false,
    canUpdatePayment: false,
    canUpdateDelivery: false,
    canApproveDiscount: false,
  },
  SALES_MANAGER: {
    canCreateCustomer: true,
    canCreateOpportunity: true,
    canCreateQuotation: true,
    canEditBasePrice: false,
    canEditMaxDiscount: false,
    canEditDpPrice: false,
    canEditStock: false,
    canViewInternalPricing: true,
    canViewAllOpportunities: true,
    canViewDashboard: true,
    canManageUsers: false,
    canUpdatePayment: false,
    canUpdateDelivery: false,
    canApproveDiscount: true,
  },
  ACCOUNTING: {
    canCreateCustomer: false,
    canCreateOpportunity: false,
    canCreateQuotation: false,
    canEditBasePrice: false,
    canEditMaxDiscount: false,
    canEditDpPrice: false,
    canEditStock: false,
    canViewInternalPricing: true,
    canViewAllOpportunities: true,
    canViewDashboard: true,
    canManageUsers: false,
    canUpdatePayment: true,
    canUpdateDelivery: false,
    canApproveDiscount: false,
  },
  WAREHOUSE: {
    canCreateCustomer: false,
    canCreateOpportunity: false,
    canCreateQuotation: false,
    canEditBasePrice: false,
    canEditMaxDiscount: false,
    canEditDpPrice: false,
    canEditStock: true,
    canViewInternalPricing: false,
    canViewAllOpportunities: false,
    canViewDashboard: false,
    canManageUsers: false,
    canUpdatePayment: false,
    canUpdateDelivery: true,
    canApproveDiscount: false,
  },
  MANAGER: {
    canCreateCustomer: true,
    canCreateOpportunity: true,
    canCreateQuotation: true,
    canEditBasePrice: true,
    canEditMaxDiscount: true,
    canEditDpPrice: true,
    canEditStock: true,
    canViewInternalPricing: true,
    canViewAllOpportunities: true,
    canViewDashboard: true,
    canManageUsers: true,
    canUpdatePayment: true,
    canUpdateDelivery: true,
    canApproveDiscount: true,
  },
};

// --- Rejection Reasons (Seed Data) ---
export const DEFAULT_REJECTION_REASONS: SelectOption[] = [
  { value: 'price_high', label: 'Giá cao' },
  { value: 'competitor', label: 'Chọn đối thủ' },
  { value: 'project_stopped', label: 'Dự án dừng' },
  { value: 'no_need', label: 'Không còn nhu cầu' },
  { value: 'timeline', label: 'Không đáp ứng tiến độ' },
  { value: 'policy', label: 'Chính sách không phù hợp' },
  { value: 'no_response', label: 'Không phản hồi' },
  { value: 'other', label: 'Khác' },
];

// --- Customer Sources ---
export const CUSTOMER_SOURCES: SelectOption[] = [
  { value: 'referral', label: 'Giới thiệu' },
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Điện thoại' },
  { value: 'email', label: 'Email' },
  { value: 'exhibition', label: 'Triển lãm' },
  { value: 'social_media', label: 'Mạng xã hội' },
  { value: 'direct', label: 'Trực tiếp' },
  { value: 'other', label: 'Khác' },
];

// --- Nav Menu Items ---
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/products', label: 'Sản phẩm', icon: 'Package' },
  { path: '/customers', label: 'Khách hàng', icon: 'Users' },
  { path: '/projects', label: 'Dự án', icon: 'FolderKanban' },
  { path: '/opportunities', label: 'Cơ hội bán hàng', icon: 'Target' },
  { path: '/quotations', label: 'Báo giá', icon: 'FileText' },
  { path: '/orders', label: 'Đơn hàng', icon: 'ShoppingCart' },
  { path: '/contracts', label: 'Hợp đồng', icon: 'FileSignature' },
  { path: '/payments', label: 'Thanh toán', icon: 'CreditCard' },
  { path: '/deliveries', label: 'Giao hàng', icon: 'Truck' },
] as const;

// --- Auto Code Prefixes ---
export const CODE_PREFIXES = {
  OPPORTUNITY: 'OPP',
  QUOTATION: 'BG',
  ORDER: 'DH',
  CONTRACT: 'HD',
  SALE_QUOTATION: 'BG',
} as const;

// --- Sale Quotation Status (Customer-linked) ---
export const SALE_QUOTATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SENT: 'Đã gửi',
  TRACKING: 'Đang theo dõi',
  NEGOTIATING: 'Đang đàm phán',
  WON: 'Đã chốt',
  LOST: 'Không chốt',
  EXPIRED: 'Hết hiệu lực',
};

export const SALE_QUOTATION_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  SENT: 'info',
  TRACKING: 'info',
  NEGOTIATING: 'warning',
  WON: 'success',
  LOST: 'danger',
  EXPIRED: 'default',
};
