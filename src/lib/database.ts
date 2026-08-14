import { v4 as uuidv4 } from 'uuid';
import type { 
  Product, Customer, Project, Opportunity, OpportunityStatus, User, AuditLog 
} from './types';

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
      console.error('Error reading ' + key + ' from localStorage', e);
      return [];
    }
  }

  private set<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error writing ' + key + ' to localStorage', e);
    }
  }

  private initializeDemoData(): void {
    if (!localStorage.getItem(KEYS.USERS) || this.getUsers().length === 0) {
      this.seedDemoData();
    }
  }

  // --- Users ---
  getUsers(): User[] { return this.get<User>(KEYS.USERS); }
  getUser(id: string): User | undefined { return this.getUsers().find(u => u.id === id); }
  getUserByEmail(email: string): User | undefined { return this.getUsers().find(u => u.email === email); }
  createUser(data: { full_name: string, email: string, role?: string }): User {
    const users = this.getUsers();
    const newUser: User = {
      id: uuidv4(),
      full_name: data.full_name,
      email: data.email,
      role: (data.role || 'SALE') as any,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    users.push(newUser);
    this.set(KEYS.USERS, users);
    return newUser;
  }

  // --- Products ---
  getProducts(): Product[] { return this.get<Product>(KEYS.PRODUCTS).map(p => this.computeProductFields(p)); }
  getProduct(id: string): Product | undefined {
    const product = this.getProducts().find(p => p.id === id);
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
    if (index === -1) throw new Error('Product with id ' + id + ' not found');
    products[index] = this.computeProductFields({ ...products[index], ...data, updated_at: new Date().toISOString() });
    this.set(KEYS.PRODUCTS, products);
    return products[index];
  }
  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return this.getProducts().filter(p => 
      p.product_name.toLowerCase().includes(lowerQuery) || p.product_code.toLowerCase().includes(lowerQuery)
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
  getCustomers(): Customer[] { return this.get<Customer>(KEYS.CUSTOMERS); }
  getCustomer(id: string): Customer | undefined { return this.getCustomers().find(c => c.id === id); }
  createCustomer(data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = { ...data, id: uuidv4(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    customers.push(newCustomer);
    this.set(KEYS.CUSTOMERS, customers);
    return newCustomer;
  }
  updateCustomer(id: string, data: Partial<Customer>): Customer {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer with id ' + id + ' not found');
    customers[index] = { ...customers[index], ...data, updated_at: new Date().toISOString() };
    this.set(KEYS.CUSTOMERS, customers);
    return customers[index];
  }
  searchCustomers(query: string): Customer[] {
    const lowerQuery = query.toLowerCase();
    return this.getCustomers().filter(c => c.customer_name.toLowerCase().includes(lowerQuery));
  }

  // --- Projects ---
  getProjects(): Project[] { return this.get<Project>(KEYS.PROJECTS); }
  getProjectsByCustomer(customerId: string): Project[] { return this.getProjects().filter(p => p.customer_id === customerId); }
  getProject(id: string): Project | undefined { return this.getProjects().find(p => p.id === id); }
  createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const projects = this.getProjects();
    const newProject: Project = { ...data, id: uuidv4(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    projects.push(newProject);
    this.set(KEYS.PROJECTS, projects);
    return newProject;
  }
  updateProject(id: string, data: Partial<Project>): Project {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project with id ' + id + ' not found');
    projects[index] = { ...projects[index], ...data, updated_at: new Date().toISOString() };
    this.set(KEYS.PROJECTS, projects);
    return projects[index];
  }

  // --- Opportunities ---
  getOpportunities(): Opportunity[] { return this.get<Opportunity>(KEYS.OPPORTUNITIES); }
  getOpportunity(id: string): Opportunity | undefined { return this.getOpportunities().find(o => o.id === id); }
  createOpportunity(data: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'opportunity_code'>): Opportunity {
    const opportunities = this.getOpportunities();
    const code = this.getNextCode('OPP');
    const newOpportunity: Opportunity = { ...data, id: uuidv4(), opportunity_code: code, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    opportunities.push(newOpportunity);
    this.set(KEYS.OPPORTUNITIES, opportunities);
    return newOpportunity;
  }
  updateOpportunity(id: string, data: Partial<Opportunity>): Opportunity {
    const opportunities = this.getOpportunities();
    const index = opportunities.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Opportunity with id ' + id + ' not found');
    opportunities[index] = { ...opportunities[index], ...data, updated_at: new Date().toISOString() };
    this.set(KEYS.OPPORTUNITIES, opportunities);
    return opportunities[index];
  }
  updateOpportunityStatus(id: string, status: OpportunityStatus, rejectionData?: any): Opportunity {
    return this.updateOpportunity(id, { status, ...(rejectionData && { rejection_notes: rejectionData }) });
  }
  getNextCode(prefix: string): string {
    const key = 'smapp_sequence_' + prefix;
    const currentSeq = parseInt(localStorage.getItem(key) || '0', 10);
    const nextSeq = currentSeq + 1;
    localStorage.setItem(key, nextSeq.toString());
    return prefix + '-' + nextSeq.toString().padStart(4, '0');
  }

  // --- Audit ---
  addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): void {
    const logs = this.getAuditLogs();
    logs.push({ ...log, id: uuidv4(), created_at: new Date().toISOString() });
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
    console.log('Seeding LARGE demo data...');
    const now = new Date().toISOString();
    const users: User[] = [{ id: uuidv4(), full_name: 'Admin User', role: 'ADMIN', email: 'admin@sale.com', is_active: true, created_at: now, updated_at: now }];
    this.set(KEYS.USERS, users);

    const brands = ['SMC', 'Grundfos', 'Danfoss', 'Endress+Hauser', 'Siemens', 'Yamada', 'ABB', 'HHG'];
    const groups = ['Bơm', 'Van', 'Cảm biến', 'Động cơ', 'Tủ điện', 'Phụ kiện', 'Thiết bị công nghiệp'];
    const products: Product[] = [];
    for (let i = 1; i <= 100; i++) {
      const basePrice = Math.floor(Math.random() * 50000000) + 1000000;
      products.push(this.computeProductFields({
        id: uuidv4(),
        product_code: 'PRD-' + i.toString().padStart(4, '0'),
        product_name: 'Sản phẩm Demo ' + i,
        product_group: groups[Math.floor(Math.random() * groups.length)],
        unit: 'Cái',
        base_price: basePrice,
        vat_rate: 0.08,
        max_discount_rate: Math.random() * 0.2,
        brand: brands[Math.floor(Math.random() * brands.length)],
        stock_quantity: Math.floor(Math.random() * 200),
        reserved_quantity: Math.floor(Math.random() * 20),
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
        dp_price: 0,
        available_quantity: 0
      }));
    }
    this.set(KEYS.PRODUCTS, products);

    const customers: Customer[] = [];
    for (let i = 1; i <= 30; i++) {
      customers.push({
        id: uuidv4(),
        customer_name: 'Khách hàng Demo ' + i,
        company_name: 'Công ty TNHH Demo ' + i,
        phone: '0900' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        email: 'contact' + i + '@demo.com',
        address: 'Địa chỉ ' + i + ', TP.HCM',
        tax_code: '03' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
        is_active: true,
        created_at: now,
        updated_at: now
      });
    }
    this.set(KEYS.CUSTOMERS, customers);

    const projects: Project[] = [];
    for (let i = 1; i <= 20; i++) {
      projects.push({
        id: uuidv4(),
        project_name: 'Dự án ' + i,
        customer_id: customers[Math.floor(Math.random() * customers.length)].id,
        status: Math.random() > 0.5 ? 'ACTIVE' : 'COMPLETED',
        notes: 'Dự án demo',
        created_at: now,
        updated_at: now
      });
    }
    this.set(KEYS.PROJECTS, projects);

    const oppStatuses = ['LEAD', 'CONSULTING', 'QUOTING', 'SENT', 'NEGOTIATING', 'WON', 'LOST'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const reasons = ['price_high', 'competitor', 'project_stopped'];
    const opportunities: Opportunity[] = [];
    for (let i = 1; i <= 50; i++) {
      const status = oppStatuses[Math.floor(Math.random() * oppStatuses.length)] as OpportunityStatus;
      opportunities.push({
        id: uuidv4(),
        opportunity_code: 'OPP-' + i.toString().padStart(4, '0'),
        notes: 'Cơ hội demo ' + i,
        customer_id: customers[Math.floor(Math.random() * customers.length)].id,
        project_id: Math.random() > 0.5 ? projects[Math.floor(Math.random() * projects.length)].id : undefined,
        estimated_value: Math.floor(Math.random() * 1000000000) + 10000000,
        priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
        expected_close_date: new Date(Date.now() + (Math.random() * 30 - 15) * 86400000).toISOString(),
        status: status,
        rejection_notes: status === 'LOST' ? reasons[Math.floor(Math.random() * reasons.length)] : undefined,
        assigned_sale_id: users[0].id,
        received_date: now,
        created_at: now,
        updated_at: now
      });
    }
    this.set(KEYS.OPPORTUNITIES, opportunities);
    localStorage.setItem('smapp_sequence_OPP', '50');
  }
}

export const db = new Database();
