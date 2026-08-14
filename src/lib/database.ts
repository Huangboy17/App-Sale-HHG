import { v4 as uuidv4 } from 'uuid';
import type { 
  Product, Customer, Transaction, Quotation, QuotationVersion, 
  QuotationItem, Contract, ContractItem, Payment, Activity, 
  User, AuditLog, Order, OrderItem
} from './types';

export const KEYS = {
  PRODUCTS: 'smapp_products',
  CUSTOMERS: 'smapp_customers',
  TRANSACTIONS: 'smapp_transactions',
  QUOTATIONS: 'smapp_quotations',
  QUOTATION_VERSIONS: 'smapp_quotation_versions',
  QUOTATION_ITEMS: 'smapp_quotation_items',
  CONTRACTS: 'smapp_contracts',
  CONTRACT_ITEMS: 'smapp_contract_items',
  PAYMENTS: 'smapp_payments',
  ACTIVITIES: 'smapp_activities',
  USERS: 'smapp_users',
  AUDIT_LOGS: 'smapp_audit_logs',
};

class Database {
  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeDemoData();
    }
  }

  public get<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading ' + key + ' from localStorage', e);
      return [];
    }
  }

  public set<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error writing ' + key + ' to localStorage', e);
    }
  }

  private initializeDemoData(): void {
    if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
      this.seedDemoData();
    }
  }

  public getNextCode(prefix: string): string {
    const key = 'smapp_sequence_' + prefix;
    const currentSeq = parseInt(localStorage.getItem(key) || '0', 10);
    const nextSeq = currentSeq + 1;
    localStorage.setItem(key, nextSeq.toString());
    return prefix + '-' + nextSeq.toString().padStart(4, '0');
  }

  public findAll<T>(key: string): T[] {
    return this.get<T>(key);
  }

  public findById<T extends { id: string }>(key: string, id: string): T | undefined {
    return this.findAll<T>(key).find(item => item.id === id);
  }

  public create<T extends { id?: string; created_at?: string; updated_at?: string }>(key: string, data: T): T {
    const items = this.findAll<T>(key);
    const now = new Date().toISOString();
    const newItem = { 
      ...data, 
      id: data.id || uuidv4(), 
      created_at: data.created_at || now, 
      updated_at: data.updated_at || now 
    } as T;
    items.push(newItem);
    this.set(key, items);
    return newItem;
  }

  public update<T extends { id: string; updated_at?: string }>(key: string, id: string, data: Partial<T>): T {
    const items = this.findAll<T>(key);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`Item with id ${id} not found in ${key}`);
    const updatedItem = { 
      ...items[index], 
      ...data, 
      updated_at: new Date().toISOString() 
    } as T;
    items[index] = updatedItem;
    this.set(key, items);
    return updatedItem;
  }

  public delete(key: string, id: string): void {
    let items = this.findAll<{ id: string }>(key);
    items = items.filter(item => item.id !== id);
    this.set(key, items);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): void {
    this.create(KEYS.AUDIT_LOGS, log as any);
  }

  public seedDemoData(): void {
    console.log('Seeding CRM data for Transaction-Centric Model...');
    const now = new Date().toISOString();
    
    const users: User[] = [{
      id: uuidv4(),
      full_name: 'Admin User',
      role: 'ADMIN',
      email: 'admin@sale.com',
      is_active: true,
      created_at: now,
      updated_at: now
    }];
    this.set(KEYS.USERS, users);
    const defaultUserId = users[0].id;

    const brands = ['SMC', 'Grundfos', 'Danfoss', 'Siemens', 'ABB'];
    const groups = ['Bơm', 'Van', 'Cảm biến', 'Động cơ', 'Phụ kiện'];
    const products: Product[] = [];
    for (let i = 1; i <= 20; i++) {
      const basePrice = Math.floor(Math.random() * 50000000) + 1000000;
      const maxDiscountRate = Math.random() * 0.2;
      const stock = Math.floor(Math.random() * 200);
      const reserved = Math.floor(Math.random() * 20);
      
      products.push({
        id: uuidv4(),
        product_code: 'PRD-' + i.toString().padStart(4, '0'),
        product_name: 'Sản phẩm Demo ' + i,
        product_group: groups[Math.floor(Math.random() * groups.length)],
        unit: 'Cái',
        base_price: basePrice,
        vat_rate: 0.08,
        max_discount_rate: maxDiscountRate,
        dp_price: basePrice * (1 - maxDiscountRate),
        brand: brands[Math.floor(Math.random() * brands.length)],
        stock_quantity: stock,
        reserved_quantity: reserved,
        available_quantity: stock - reserved,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now
      });
    }
    this.set(KEYS.PRODUCTS, products);

    const customers: Customer[] = [];
    for (let i = 1; i <= 5; i++) {
      customers.push({
        id: uuidv4(),
        customer_name: 'Khách hàng Demo ' + i,
        company_name: 'Công ty TNHH Demo ' + i,
        phone: '0900' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        email: 'contact' + i + '@demo.com',
        address: 'Địa chỉ ' + i + ', TP.HCM',
        tax_code: '03' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
        is_active: true,
        status: i % 2 === 0 ? 'WON' : 'TRACKING',
        created_at: now,
        updated_at: now
      });
    }
    this.set(KEYS.CUSTOMERS, customers);

    const transactions: Transaction[] = [];
    const activities: Activity[] = [];
    const quotations: Quotation[] = [];
    const quotationVersions: QuotationVersion[] = [];
    const quotationItems: QuotationItem[] = [];
    const contracts: Contract[] = [];
    const contractItems: ContractItem[] = [];
    const payments: Payment[] = [];

    const t1Id = uuidv4();
    transactions.push({
      id: t1Id,
      transaction_code: 'TRX-0001',
      customer_id: customers[0].id,
      project_name: 'Dự án Nâng cấp Hệ thống Bơm',
      assigned_sale_id: defaultUserId,
      expected_value: 150000000,
      status: 'TRACKING',
      next_action: 'Gửi báo giá v2',
      next_action_date: new Date(Date.now() + 86400000).toISOString(),
      created_at: now,
      updated_at: now
    });
    activities.push({ id: uuidv4(), transaction_id: t1Id, activity_type: 'NOTE', description: 'Gặp gỡ khách hàng, lấy yêu cầu', created_by: defaultUserId, created_at: now, updated_at: now });
    
    const q1Id = uuidv4();
    quotations.push({ id: q1Id, quotation_code: 'QT-0001', transaction_id: t1Id, created_by: defaultUserId, created_at: now, updated_at: now });
    
    const qv1Id = uuidv4();
    quotationVersions.push({
      id: qv1Id,
      quotation_id: q1Id,
      version_number: 1,
      status: 'REPLACED',
      validity_period: 15,
      subtotal: products[0].base_price * 2,
      total_vat: products[0].base_price * 2 * 0.08,
      total_amount: products[0].base_price * 2 * 1.08,
      created_by: defaultUserId,
      created_at: now,
      updated_at: now
    });
    quotationItems.push({
      id: uuidv4(),
      quotation_version_id: qv1Id,
      product_id: products[0].id,
      line_number: 1,
      product_code: products[0].product_code,
      product_name: products[0].product_name,
      brand: products[0].brand,
      unit: products[0].unit,
      base_price: products[0].base_price,
      max_discount_rate: products[0].max_discount_rate,
      dp_price: products[0].dp_price,
      vat_rate: products[0].vat_rate,
      quantity: 2,
      discount_rate: 0,
      unit_price: products[0].base_price,
      line_subtotal: products[0].base_price * 2,
      line_vat: products[0].base_price * 2 * 0.08,
      line_total: products[0].base_price * 2 * 1.08,
      created_at: now
    });

    const qv2Id = uuidv4();
    quotationVersions.push({
      id: qv2Id,
      quotation_id: q1Id,
      version_number: 2,
      status: 'CURRENT',
      validity_period: 15,
      subtotal: products[0].base_price * 2 * 0.95,
      total_vat: products[0].base_price * 2 * 0.95 * 0.08,
      total_amount: products[0].base_price * 2 * 0.95 * 1.08,
      created_by: defaultUserId,
      created_at: now,
      updated_at: now
    });
    quotationItems.push({
      id: uuidv4(),
      quotation_version_id: qv2Id,
      product_id: products[0].id,
      line_number: 1,
      product_code: products[0].product_code,
      product_name: products[0].product_name,
      brand: products[0].brand,
      unit: products[0].unit,
      base_price: products[0].base_price,
      max_discount_rate: products[0].max_discount_rate,
      dp_price: products[0].dp_price,
      vat_rate: products[0].vat_rate,
      quantity: 2,
      discount_rate: 0.05,
      unit_price: products[0].base_price * 0.95,
      line_subtotal: products[0].base_price * 2 * 0.95,
      line_vat: products[0].base_price * 2 * 0.95 * 0.08,
      line_total: products[0].base_price * 2 * 0.95 * 1.08,
      created_at: now
    });
    activities.push({ id: uuidv4(), transaction_id: t1Id, activity_type: 'QUOTATION', description: 'Đã gửi báo giá v2', created_by: defaultUserId, created_at: now, updated_at: now });

    const t2Id = uuidv4();
    transactions.push({
      id: t2Id,
      transaction_code: 'TRX-0002',
      customer_id: customers[1].id,
      project_name: 'Dự án Cung cấp Van Công nghiệp',
      assigned_sale_id: defaultUserId,
      expected_value: 200000000,
      status: 'WON',
      created_at: now,
      updated_at: now
    });
    activities.push({ id: uuidv4(), transaction_id: t2Id, activity_type: 'NOTE', description: 'Chốt đơn hàng', created_by: defaultUserId, created_at: now, updated_at: now });

    const q2Id = uuidv4();
    const q2v1Id = uuidv4();
    quotations.push({ id: q2Id, quotation_code: 'QT-0002', transaction_id: t2Id, created_by: defaultUserId, created_at: now, updated_at: now });
    quotationVersions.push({
      id: q2v1Id,
      quotation_id: q2Id,
      version_number: 1,
      status: 'CURRENT',
      validity_period: 30,
      subtotal: products[1].base_price * 5,
      total_vat: products[1].base_price * 5 * 0.08,
      total_amount: products[1].base_price * 5 * 1.08,
      created_by: defaultUserId,
      created_at: now,
      updated_at: now
    });

    const c1Id = uuidv4();
    contracts.push({
      id: c1Id,
      contract_code: 'CT-0001',
      transaction_id: t2Id,
      quotation_version_id: q2v1Id,
      customer_id: customers[1].id,
      contract_value: products[1].base_price * 5 * 1.08,
      status: 'SIGNED',
      created_at: now,
      updated_at: now
    });
    activities.push({ id: uuidv4(), transaction_id: t2Id, activity_type: 'CONTRACT', description: 'Đã ký hợp đồng CT-0001', created_by: defaultUserId, created_at: now, updated_at: now });

    payments.push({
      id: uuidv4(),
      contract_id: c1Id,
      payment_date: now,
      amount: (products[1].base_price * 5 * 1.08) * 0.5,
      payment_method: 'BANK_TRANSFER',
      created_by: defaultUserId,
      created_at: now,
      updated_at: now
    });
    activities.push({ id: uuidv4(), transaction_id: t2Id, activity_type: 'PAYMENT', description: 'Nhận tạm ứng 50%', created_by: defaultUserId, created_at: now, updated_at: now });

    const t3Id = uuidv4();
    transactions.push({
      id: t3Id,
      transaction_code: 'TRX-0003',
      customer_id: customers[2].id,
      project_name: 'Dự án Cảm biến Kho lạnh',
      assigned_sale_id: defaultUserId,
      expected_value: 50000000,
      status: 'LOST',
      rejection_reason: 'Giá cao hơn đối thủ',
      created_at: now,
      updated_at: now
    });
    activities.push({ id: uuidv4(), transaction_id: t3Id, activity_type: 'NOTE', description: 'Khách hàng chọn nhà cung cấp khác vì giá', created_by: defaultUserId, created_at: now, updated_at: now });

    this.set(KEYS.TRANSACTIONS, transactions);
    this.set(KEYS.ACTIVITIES, activities);
    this.set(KEYS.QUOTATIONS, quotations);
    this.set(KEYS.QUOTATION_VERSIONS, quotationVersions);
    this.set(KEYS.QUOTATION_ITEMS, quotationItems);
    this.set(KEYS.CONTRACTS, contracts);
    this.set(KEYS.CONTRACT_ITEMS, contractItems);
    this.set(KEYS.PAYMENTS, payments);
    
    localStorage.setItem('smapp_sequence_TRX', '3');
    localStorage.setItem('smapp_sequence_QT', '2');
    localStorage.setItem('smapp_sequence_CT', '1');
  }
}

export const db = new Database();
