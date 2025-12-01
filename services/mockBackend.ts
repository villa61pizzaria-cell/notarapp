import { ReceiptData, User, UserRole, ChecklistStats, Tenant, SaaSMetrics, SystemLog, Permission } from "../types";

const STORAGE_KEYS = {
  USERS: 'notar_users',
  RECEIPTS: 'notar_receipts',
  CURRENT_USER: 'notar_current_user',
  TENANTS: 'notar_tenants' // New key for tenants
};

// Seed Data with Permissions and Status
const INITIAL_USERS: User[] = [
  // 1. Dono da Empresa (Cliente) - Aprovado
  { 
    id: 'u1', name: 'Carlos Dono', email: 'dono@empresa.com', role: 'business', subRole: 'owner', status: 'active',
    companyName: 'Empresa Exemplo LTDA', cnpj: '12345678000199', accountingFirmId: 'u3',
    permissions: ['view_financials', 'edit_receipts', 'manage_users']
  },
  // 2. Funcionário da Empresa - Aprovado
  { 
    id: 'u2', name: 'João Funcionário', email: 'func@empresa.com', role: 'business', subRole: 'employee', status: 'active',
    companyName: 'Empresa Exemplo LTDA', cnpj: '12345678000199', accountingFirmId: 'u3',
    permissions: ['upload_only']
  },
  // 3. Contador Gestor - Aprovado
  { 
    id: 'u3', name: 'Ana Gestora', email: 'gestor@contabil.com', role: 'accounting', subRole: 'manager', status: 'active',
    permissions: ['view_financials', 'edit_receipts', 'delete_receipts', 'approve_receipts', 'manage_users']
  },
  // 4. Contador Assistente - Pendente de Aprovação (Para teste)
  { 
    id: 'u4', name: 'Pedro Assistente (Pendente)', email: 'pendente@contabil.com', role: 'accounting', subRole: 'assistant', status: 'pending',
    permissions: ['edit_receipts', 'approve_receipts']
  },
  // 5. Super Admin SaaS
  { 
    id: 'u99', name: 'Super Admin', email: 'root@notar.com', role: 'admin', status: 'active',
    permissions: ['manage_users', 'view_financials'] 
  }
];

const INITIAL_TENANTS: Tenant[] = [
    { id: 't1', name: 'Escritório Contábil Silva', plan: 'pro', status: 'active', usersCount: 15, storageUsedGB: 12.4, joinedAt: '2024-01-10' },
    { id: 't2', name: 'Alpha Tech & Contabilidade', plan: 'enterprise', status: 'active', usersCount: 45, storageUsedGB: 89.2, joinedAt: '2023-11-05' },
    { id: 't3', name: 'Gestão Ágil', plan: 'starter', status: 'delinquent', usersCount: 2, storageUsedGB: 0.5, joinedAt: '2024-02-20' },
    { id: 't4', name: 'Santos e Associados', plan: 'pro', status: 'active', usersCount: 8, storageUsedGB: 5.1, joinedAt: '2023-12-12' },
    { id: 't5', name: 'Auditores Prime', plan: 'enterprise', status: 'active', usersCount: 22, storageUsedGB: 45.0, joinedAt: '2023-10-01' },
];

const generateHistoricalReceipts = (): ReceiptData[] => {
    const categories = ['Alimentação', 'Combustível', 'Material de Escritório', 'Serviços', 'Outros'];
    const merchants = ['Posto Shell', 'Kalunga', 'Restaurante Silva', 'AWS Services', 'Uber'];
    const receipts: ReceiptData[] = [];
    const now = new Date();
    for (let i = 0; i < 45; i++) {
        const daysAgo = Math.floor(Math.random() * 180);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        const amount = 50 + Math.random() * 800;
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        receipts.push({
            id: `r_seed_${i}`,
            userId: 'u1', // Linked to the Owner
            userCompanyName: 'Empresa Exemplo',
            imageUrl: `https://picsum.photos/300/500?random=${i}`,
            status: daysAgo > 5 ? 'processed' : 'confirmed',
            createdAt: date.toISOString(),
            totalAmount: parseFloat(amount.toFixed(2)),
            merchantName: merchants[Math.floor(Math.random() * merchants.length)],
            category: category,
            ocrConfidence: 0.95,
            confidenceScore: 0.95,
            summary: { 
                total: parseFloat(amount.toFixed(2)), 
                date: date.toISOString().split('T')[0], 
                category: category,
                cnpj: '12345678000199'
            }
        });
    }
    return receipts;
};

const INITIAL_RECEIPTS: ReceiptData[] = generateHistoricalReceipts();

const initStorage = () => {
  let users: User[] = [];
  const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  
  if (!storedUsers) {
    users = INITIAL_USERS;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } else {
    users = JSON.parse(storedUsers);
    // Migration: Check if Root Admin exists, if not, inject it (fix for returning users)
    const adminExists = users.find(u => u.email === 'root@notar.com');
    if (!adminExists) {
        const rootUser = INITIAL_USERS.find(u => u.email === 'root@notar.com');
        if (rootUser) {
            users.push(rootUser);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.RECEIPTS)) {
    const current = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    if (!current || JSON.parse(current).length === 0) {
        localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(INITIAL_RECEIPTS));
    }
  }

  // Init Tenants
  if (!localStorage.getItem(STORAGE_KEYS.TENANTS)) {
      localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(INITIAL_TENANTS));
  }
};

initStorage();

export const mockBackend = {
  login: async (email: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 600)); // Simulate delay
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.email === email);
    
    if (!user) throw new Error("Usuário não encontrado");
    
    if (user.status === 'pending') {
        throw new Error("Sua conta ainda está aguardando aprovação.");
    }
    if (user.status === 'blocked') {
        throw new Error("Acesso bloqueado. Contate o administrador.");
    }

    return user;
  },

  register: async (data: Partial<User>): Promise<User> => {
      await new Promise(r => setTimeout(r, 800));
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      
      if (users.find((u: User) => u.email === data.email)) {
          throw new Error("Email já cadastrado.");
      }

      // Define default permissions based on role
      let permissions: Permission[] = [];
      if (data.role === 'accounting') permissions = ['view_financials', 'edit_receipts', 'approve_receipts'];
      if (data.role === 'business') permissions = ['view_financials', 'edit_receipts'];
      
      const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: data.name || 'Novo Usuário',
          email: data.email || '',
          role: data.role || 'business',
          subRole: data.subRole || 'owner',
          status: 'pending', // ALWAYS PENDING
          permissions: permissions,
          companyName: data.companyName,
          accountingFirmId: 'u3' // In a real app, this would be selected. Here we link to the default Accountant.
      };

      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return newUser;
  },

  // --- USER MANAGEMENT (HIERARCHY) ---

  getPendingUsers: async (adminRole: UserRole, adminId: string): Promise<User[]> => {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      
      // SaaS Admin sees pending Accountants
      if (adminRole === 'admin') {
          return users.filter((u: User) => u.status === 'pending' && u.role === 'accounting');
      }
      
      // Accountant sees pending Business clients linked to them
      if (adminRole === 'accounting') {
          return users.filter((u: User) => u.status === 'pending' && (u.role === 'business' || u.subRole === 'assistant'));
      }

      return [];
  },

  updateUserStatus: async (targetUserId: string, newStatus: 'active' | 'blocked'): Promise<void> => {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const index = users.findIndex((u: User) => u.id === targetUserId);
      if (index !== -1) {
          users[index].status = newStatus;
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
  },

  getReceipts: async (role: UserRole, userId?: string): Promise<ReceiptData[]> => {
    const allReceipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    if (role === 'accounting' || role === 'admin') {
      return allReceipts.sort((a: ReceiptData, b: ReceiptData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return allReceipts.filter((r: ReceiptData) => r.userCompanyName === 'Empresa Exemplo').sort((a: ReceiptData, b: ReceiptData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addReceipt: async (receipt: Partial<ReceiptData>): Promise<ReceiptData> => {
    const allReceipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    const newReceipt = {
      ...receipt,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: receipt.status || 'pending_confirmation',
      confidenceScore: receipt.confidenceScore || 0.90
    } as ReceiptData;
    allReceipts.unshift(newReceipt);
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(allReceipts));
    return newReceipt;
  },

  updateReceipt: async (id: string, updates: Partial<ReceiptData>): Promise<void> => {
    const allReceipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    const index = allReceipts.findIndex((r: ReceiptData) => r.id === id);
    if (index !== -1) {
      allReceipts[index] = { ...allReceipts[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(allReceipts));
    }
  },

  deleteReceipt: async (id: string): Promise<void> => {
    const allReceipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    const filtered = allReceipts.filter((r: ReceiptData) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(filtered));
  },

  getChecklistStats: async (userId: string): Promise<ChecklistStats> => {
    const allReceipts: ReceiptData[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    const userReceipts = allReceipts.filter(r => r.userCompanyName === 'Empresa Exemplo');
    userReceipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const lastUpload = userReceipts.length > 0 ? userReceipts[0].createdAt : null;
    const now = new Date();
    let daysSince = 0;
    if (lastUpload) {
        const lastDate = new Date(lastUpload);
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    }
    let status: 'on_track' | 'warning' | 'behind' = 'on_track';
    if (daysSince > 5) status = 'warning';
    if (daysSince > 10) status = 'behind';

    return {
        totalDocsExpected: 30,
        totalDocsSent: userReceipts.filter(r => {
             const d = new Date(r.createdAt);
             return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
        lastUploadDate: lastUpload,
        daysSinceLastUpload: daysSince,
        status
    };
  },

  getTeamMembers: async (): Promise<User[]> => {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },

  addUser: async (user: Partial<User>): Promise<User> => {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const newUser = {
          ...user,
          id: Math.random().toString(36).substr(2, 9),
          status: 'active'
      } as User;
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return newUser;
  },

  deleteUser: async (id: string): Promise<void> => {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const filtered = users.filter((u: User) => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  },

  getAdminData: async (): Promise<{ metrics: SaaSMetrics, tenants: Tenant[], logs: SystemLog[] }> => {
      const metrics: SaaSMetrics = { mrr: 58240, activeTenants: 142, churnRate: 1.8, avgTicket: 410.14, serverLoad: 34 };
      
      const tenants: Tenant[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TENANTS) || '[]');
      
      const logs: SystemLog[] = [
          { id: 'l1', level: 'info', module: 'AUTH', message: 'User root@notar.com logged in', timestamp: new Date().toISOString() },
          { id: 'l2', level: 'warn', module: 'OCR', message: 'Low confidence score on receipt #4892', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: 'l3', level: 'error', module: 'API', message: 'Timeout on webhook processing (Retry 2/3)', timestamp: new Date(Date.now() - 7200000).toISOString() },
          { id: 'l4', level: 'info', module: 'SYSTEM', message: 'Backup completed successfully', timestamp: new Date(Date.now() - 86400000).toISOString() },
          { id: 'l5', level: 'info', module: 'AUTH', message: 'New accountant registered: pedro@contabil.com', timestamp: new Date(Date.now() - 90000000).toISOString() },
      ];
      
      return { metrics, tenants, logs };
  },

  updateTenant: async (id: string, updates: Partial<Tenant>): Promise<void> => {
      const tenants = JSON.parse(localStorage.getItem(STORAGE_KEYS.TENANTS) || '[]');
      const index = tenants.findIndex((t: Tenant) => t.id === id);
      if (index !== -1) {
          tenants[index] = { ...tenants[index], ...updates };
          localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
      }
  },
  
  resetData: () => {
    localStorage.clear();
    window.location.reload();
  }
};