import { v4 as uuidv4 } from 'uuid';
import type { 
  Product, 
  Customer, 
  Project, 
  Opportunity, 
  OpportunityStatus, 
  User, 
  AuditLog 
} from './types';

// Constants for localStorage keys
const KEYS = {
  PRODUCTS: 'smapp_products',
  CUSTOMERS: 'smapp_customers',
  PROJECTS: 'smapp_projects',
  OPPORTUNITIES: 'smapp_opportunities',
  USERS: 'smapp_users',
  AUDIT_LOGS: 'smapp_audit_logs',
};

class Database {
  constructor() {
    this.initializeDemoData();
  }

  private get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return [];
    }
  }

  private set<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  }

  private initializeDemoData(): void {
    if (!localStorage.getItem(KEYS.USERS) || this.getUsers().length === 0) {
      this.seedDemoData();
    }
  }

  // --- Users ---
  getUsers(): User[] {
    return this.get<User>(KEYS.USERS);
  }

  getUser(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  // --- Products ---
  getProducts(): Product[] {
    return this.get<Product>(KEYS.PRODUCTS).map(p => this.computeProductFields(p));
  }

  getProduct(id: string): Product | undefined {
    const product = this.getProducts().find(p => p.id === id);
    return product ? this.computeProductFields(product) : undefined;
  }

  getProductByCode(code: string): Product | undefined {
    const product = this.getProducts().find(p => p.product_code === code);
    return product ? this.computeProductFields(product) : undefined;
  }

  createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'dp_price' | 'available_quantity'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dp_price: data.base_price * (1 - (data.max_discount_rate || 0)),
      available_quantity: data.stock_quantity - (data.reserved_quantity || 0)
    };
    
    products.push(newProduct);
    this.set(KEYS.PRODUCTS, products);
    return newProduct;
  }

  updateProduct(id: string, data: Partial<Product>): Product {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) throw new Error(`Product with id ${id} not found`);
    
    const updatedProduct = {
      ...products[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    products[index] = this.computeProductFields(updatedProduct);
    this.set(KEYS.PRODUCTS, products);
    return products[index];
  }

  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return this.getProducts().filter(p => 
      p.product_name.toLowerCase().includes(lowerQuery) || 
      p.product_code.toLowerCase().includes(lowerQuery) ||
      (p.brand && p.brand.toLowerCase().includes(lowerQuery))
    );
  }

  private computeProductFields(product: Product): Product {
    return {
      ...product,
      dp_price: product.base_price * (1 - (product.max_discount_rate || 0)),
      available_quantity: product.stock_quantity - (product.reserved_quantity || 0)
    };
  }

  // --- Customers ---
  getCustomers(): Customer[] {
    return this.get<Customer>(KEYS.CUSTOMERS);
  }

  getCustomer(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  createCustomer(data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    customers.push(newCustomer);
    this.set(KEYS.CUSTOMERS, customers);
    return newCustomer;
  }

  updateCustomer(id: string, data: Partial<Customer>): Customer {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) throw new Error(`Customer with id ${id} not found`);
    
    customers[index] = {
      ...customers[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.set(KEYS.CUSTOMERS, customers);
    return customers[index];
  }

  searchCustomers(query: string): Customer[] {
    const lowerQuery = query.toLowerCase();
    return this.getCustomers().filter(c => 
      c.customer_name.toLowerCase().includes(lowerQuery) || 
      (c.phone && c.phone.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(lowerQuery))
    );
  }

  checkDuplicateCustomer(name: string, phone?: string, email?: string): Customer | undefined {
    return this.getCustomers().find(c => 
      c.customer_name.toLowerCase() === name.toLowerCase() ||
      (phone && c.phone === phone) ||
      (email && c.email === email)
    );
  }

  // --- Projects ---
  getProjects(): Project[] {
    return this.get<Project>(KEYS.PROJECTS);
  }

  getProjectsByCustomer(customerId: string): Project[] {
    return this.getProjects().filter(p => p.customer_id === customerId);
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find(p => p.id === id);
  }

  createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    projects.push(newProject);
    this.set(KEYS.PROJECTS, projects);
    return newProject;
  }

  updateProject(id: string, data: Partial<Project>): Project {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) throw new Error(`Project with id ${id} not found`);
    
    projects[index] = {
      ...projects[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.set(KEYS.PROJECTS, projects);
    return projects[index];
  }

  // --- Opportunities ---
  getOpportunities(): Opportunity[] {
    return this.get<Opportunity>(KEYS.OPPORTUNITIES);
  }

  getOpportunity(id: string): Opportunity | undefined {
    return this.getOpportunities().find(o => o.id === id);
  }

  createOpportunity(data: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'opportunity_code'>): Opportunity {
    const opportunities = this.getOpportunities();
    const code = this.getNextCode('OPP');
    const newOpportunity: Opportunity = {
      ...data,
      id: uuidv4(),
      opportunity_code: code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    opportunities.push(newOpportunity);
    this.set(KEYS.OPPORTUNITIES, opportunities);
    return newOpportunity;
  }

  updateOpportunity(id: string, data: Partial<Opportunity>): Opportunity {
    const opportunities = this.getOpportunities();
    const index = opportunities.findIndex(o => o.id === id);
    
    if (index === -1) throw new Error(`Opportunity with id ${id} not found`);
    
    opportunities[index] = {
      ...opportunities[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.set(KEYS.OPPORTUNITIES, opportunities);
    return opportunities[index];
  }

  updateOpportunityStatus(id: string, status: OpportunityStatus, rejectionData?: any): Opportunity {
    return this.updateOpportunity(id, { 
      status, 
      ...(rejectionData && { rejection_reason: rejectionData }) 
    });
  }

  getNextCode(prefix: string): string {
    const key = `smapp_sequence_${prefix}`;
    const currentSeq = parseInt(localStorage.getItem(key) || '0', 10);
    const nextSeq = currentSeq + 1;
    localStorage.setItem(key, nextSeq.toString());
    return `${prefix}-${nextSeq.toString().padStart(4, '0')}`;
  }

  // --- Audit ---
  addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    this.set(KEYS.AUDIT_LOGS, logs);
  }

  getAuditLogs(entityType?: string, entityId?: string): AuditLog[] {
    let logs = this.get<AuditLog>(KEYS.AUDIT_LOGS);
    if (entityType) logs = logs.filter(l => l.entity_type === entityType);
    if (entityId) logs = logs.filter(l => l.entity_id === entityId);
    return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- Seed Data ---
  seedDemoData(): void {
    console.log('Seeding demo data...');
    
    const now = new Date().toISOString();
    
    // Users
    const users: User[] = [
      { id: uuidv4(), full_name: 'Admin', role: 'ADMIN', email: 'admin@hhg.vn', is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), full_name: 'Nguyễn Văn A', role: 'SALE', email: 'nva@hhg.vn', is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), full_name: 'Trần Thị B', role: 'SALE', email: 'ttb@hhg.vn', is_active: true, created_at: now, updated_at: now },
    ];
    this.set(KEYS.USERS, users);

    // Products
    const products: Product[] = [
      { id: uuidv4(), product_code: 'PROD-001', product_name: 'Máy nén khí trục vít', product_group: 'Thiết bị công nghiệp', unit: 'Cái', base_price: 150000000, vat_rate: 0.08, max_discount_rate: 0.15, brand: 'SMC', stock_quantity: 10, reserved_quantity: 2, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
      { id: uuidv4(), product_code: 'PROD-002', product_name: 'Bơm chìm giếng khoan', product_group: 'Bơm', unit: 'Cái', base_price: 45000000, vat_rate: 0.08, max_discount_rate: 0.10, brand: 'Grundfos', stock_quantity: 25, reserved_quantity: 5, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
      { id: uuidv4(), product_code: 'PROD-003', product_name: 'Van điện từ tuyến tính', product_group: 'Van', unit: 'Cái', base_price: 12000000, vat_rate: 0.08, max_discount_rate: 0.20, brand: 'Danfoss', stock_quantity: 50, reserved_quantity: 10, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
      { id: uuidv4(), product_code: 'PROD-004', product_name: 'Đồng hồ đo áp suất điện tử', product_group: 'Đồng hồ', unit: 'Cái', base_price: 8500000, vat_rate: 0.08, max_discount_rate: 0.15, brand: 'Endress+Hauser', stock_quantity: 40, reserved_quantity: 0, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
      { id: uuidv4(), product_code: 'PROD-005', product_name: 'Biến tần 3 pha 15kW', product_group: 'Thiết bị điện', unit: 'Bộ', base_price: 22000000, vat_rate: 0.08, max_discount_rate: 0.12, brand: 'Siemens', stock_quantity: 15, reserved_quantity: 3, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
      { id: uuidv4(), product_code: 'PROD-006', product_name: 'Bộ lọc khí nén', product_group: 'Phụ kiện', unit: 'Cái', base_price: 5000000, vat_rate: 0.08, max_discount_rate: 0.10, brand: 'SMC', stock_quantity: 100, reserved_quantity: 20, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
      { id: uuidv4(), product_code: 'PROD-007', product_name: 'Bơm màng khí nén', product_group: 'Bơm', unit: 'Cái', base_price: 32000000, vat_rate: 0.08, max_discount_rate: 0.15, brand: 'Yamada', stock_quantity: 12, reserved_quantity: 1, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
      { id: uuidv4(), product_code: 'PROD-008', product_name: 'Cảm biến lưu lượng siêu âm', product_group: 'Cảm biến', unit: 'Bộ', base_price: 55000000, vat_rate: 0.08, max_discount_rate: 0.18, brand: 'Siemens', stock_quantity: 8, reserved_quantity: 0, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
      { id: uuidv4(), product_code: 'PROD-009', product_name: 'Motor điện 3 pha 11kW', product_group: 'Động cơ', unit: 'Cái', base_price: 18000000, vat_rate: 0.08, max_discount_rate: 0.10, brand: 'ABB', stock_quantity: 20, reserved_quantity: 5, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
      { id: uuidv4(), product_code: 'PROD-010', product_name: 'Tủ điện điều khiển', product_group: 'Tủ điện', unit: 'Tủ', base_price: 75000000, vat_rate: 0.08, max_discount_rate: 0.20, brand: 'HHG', stock_quantity: 5, reserved_quantity: 1, status: 'ACTIVE', created_at: now, updated_at: now, dp_price: 0, available_quantity: 0 },
    ].map(p => this.computeProductFields(p));
    this.set(KEYS.PRODUCTS, products);

    // Customers
    const customers: Customer[] = [
      { id: uuidv4(), customer_name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)', company_name: 'Vinamilk', phone: '028 5415 5555', email: 'contact@vinamilk.com.vn', address: '10 Tân Trào, Tân Phú, Quận 7, TP.HCM', tax_code: '0300588569', is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), customer_name: 'Tổng công ty Cổ phần Bia - Rượu - Nước giải khát Sài Gòn', company_name: 'Sabeco', phone: '028 3829 4081', email: 'sabeco@sabeco.com.vn', address: '12 Thi Sách, Bến Nghé, Quận 1, TP.HCM', tax_code: '0300583659', is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), customer_name: 'Công ty TNHH Nhựa Long Thành', company_name: 'Nhựa Long Thành', phone: '1900 3333', email: 'info@longthanhplastic.com', address: '130 Tháp Mười, Phường 2, Quận 6, TP.HCM', tax_code: '0302222222', is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), customer_name: 'Công ty Cổ phần Nước Môi trường Bình Dương', company_name: 'Biwase', phone: '0274 3827 789', email: 'biwase@biwase.com.vn', address: '11 Ngô Văn Trị, Phú Lợi, Thủ Dầu Một, Bình Dương', tax_code: '3700145694', is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), customer_name: 'Tập đoàn Hòa Phát', company_name: 'Hòa Phát', phone: '024 3974 7749', email: 'pr@hoaphat.com.vn', address: '66 Nguyễn Du, Hai Bà Trưng, Hà Nội', tax_code: '0101234567', is_active: true, created_at: now, updated_at: now },
    ];
    this.set(KEYS.CUSTOMERS, customers);

    // Projects
    const projects: Project[] = [
      { id: uuidv4(), project_name: 'Dự án Cải tạo Dây chuyền Lọc Nước Mới', customer_id: customers[3].id, status: 'ACTIVE', notes: 'Nâng cấp hệ thống bơm và van.', created_at: now, updated_at: now },
      { id: uuidv4(), project_name: 'Lắp đặt Cảm biến Nhà máy Bia Vũng Tàu', customer_id: customers[1].id, status: 'ACTIVE', notes: 'Trang bị cảm biến siêu âm cho tank lên men.', created_at: now, updated_at: now },
      { id: uuidv4(), project_name: 'Bảo trì Hệ thống Khí nén Nhà máy Thép', customer_id: customers[4].id, status: 'COMPLETED', notes: 'Bảo trì định kỳ máy nén khí trục vít.', created_at: now, updated_at: now },
    ];
    this.set(KEYS.PROJECTS, projects);

    // Opportunities
    const opportunities: Opportunity[] = [
      { id: uuidv4(), opportunity_code: 'OPP-0001', notes: 'Cung cấp 2 Máy nén khí cho Biwase', customer_id: customers[3].id, project_id: projects[0].id, estimated_value: 300000000, priority: 'HIGH', expected_close_date: new Date(Date.now() + 86400000 * 15).toISOString(), status: 'QUOTING', assigned_sale_id: users[1].id, received_date: now, created_at: now, updated_at: now },
      { id: uuidv4(), opportunity_code: 'OPP-0002', notes: 'Thay thế Van điện từ lô 2 - Vinamilk', customer_id: customers[0].id, estimated_value: 120000000, priority: 'MEDIUM', expected_close_date: new Date(Date.now() + 86400000 * 7).toISOString(), status: 'NEGOTIATING', assigned_sale_id: users[2].id, received_date: now, created_at: now, updated_at: now },
      { id: uuidv4(), opportunity_code: 'OPP-0003', notes: 'Hệ thống Cảm biến Sabeco Vũng Tàu', customer_id: customers[1].id, project_id: projects[1].id, estimated_value: 550000000, priority: 'HIGH', expected_close_date: new Date(Date.now() + 86400000 * 45).toISOString(), status: 'CONSULTING', assigned_sale_id: users[1].id, received_date: now, created_at: now, updated_at: now },
      { id: uuidv4(), opportunity_code: 'OPP-0004', notes: 'Bơm chìm cấp nước xưởng 3', customer_id: customers[2].id, estimated_value: 90000000, priority: 'LOW', expected_close_date: now, status: 'WON', assigned_sale_id: users[2].id, received_date: now, created_at: now, updated_at: now },
      { id: uuidv4(), opportunity_code: 'OPP-0005', notes: 'Tủ điện điều khiển phụ trợ - Hòa Phát', customer_id: customers[4].id, project_id: projects[2].id, estimated_value: 150000000, priority: 'MEDIUM', expected_close_date: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'LOST', rejection_notes: 'Giá đối thủ rẻ hơn 15%', assigned_sale_id: users[1].id, received_date: now, created_at: now, updated_at: now },
    ];
    this.set(KEYS.OPPORTUNITIES, opportunities);
    localStorage.setItem('smapp_sequence_OPP', '5');
  }
}

export const db = new Database();
