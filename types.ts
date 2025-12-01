export type UserRole = 'business' | 'accounting' | 'admin';

export type SubRole = 'manager' | 'assistant' | 'employee' | 'owner';

export type UserStatus = 'active' | 'pending' | 'blocked';

export type Permission = 
  | 'view_financials'   // Ver gráficos e faturamento
  | 'edit_receipts'     // Editar valores e dados
  | 'delete_receipts'   // Excluir notas (Lixeira)
  | 'approve_receipts'  // Mudar status para processado
  | 'manage_users'      // Criar/Excluir outros usuários
  | 'upload_only';      // Apenas enviar notas

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subRole?: SubRole;        // Cargo específico
  status: UserStatus;       // Status da conta
  permissions?: Permission[]; // Lista de ações permitidas
  companyName?: string; 
  cnpj?: string;
  accountingFirmId?: string; // ID da contabilidade que gerencia este usuário (se business)
}

export type ReceiptStatus = 'pending_confirmation' | 'confirmed' | 'processed' | 'rejected';

export interface ReceiptItem {
  description: string;
  amount: number;
}

export interface Installment {
  number: string;
  date: string;
  amount: number;
}

export interface OCRData {
  rawText?: string;
  cnpjDetected?: string;
  dateDetected?: string;
  totalDetected?: number;
  itemsDetected?: ReceiptItem[];
  installmentsDetected?: Installment[];
}

export interface ReceiptSummary {
  cnpj?: string;
  date?: string;
  total?: number;
  itemsCount?: number;
  category?: string;
  installmentsCount?: number;
}

export interface ReceiptData {
  id: string;
  userId: string;
  userCompanyName: string;
  imageUrl: string;
  status: ReceiptStatus;
  createdAt: string; 
  
  merchantName?: string;
  cnpj?: string;
  date?: string;
  totalAmount?: number;
  items?: ReceiptItem[];
  category?: string;
  accountingNotes?: string; 
  notes?: string; 
  ocrConfidence?: number;

  ocr?: OCRData;
  summary?: ReceiptSummary;
  installments?: Installment[];
  confidenceScore?: number;
  chatId?: string; 
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface Message {
  id: string;
  senderId: string;
  role: 'business' | 'accounting' | 'system';
  content: string;
  type: 'text' | 'image' | 'audio';
  timestamp: string;
  relatedReceiptId?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
}

export interface ChecklistStats {
  totalDocsExpected: number;
  totalDocsSent: number;
  lastUploadDate: string | null;
  daysSinceLastUpload: number;
  status: 'on_track' | 'warning' | 'behind';
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'delinquent';
  usersCount: number;
  storageUsedGB: number;
  joinedAt: string;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  module: 'OCR' | 'AUTH' | 'API' | 'SYSTEM';
  message: string;
  timestamp: string;
}

export interface SaaSMetrics {
  mrr: number;
  activeTenants: number;
  churnRate: number;
  avgTicket: number;
  serverLoad: number;
}