export type PlanType = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'ativo' | 'cancelado' | 'atrasado';

export interface PixData {
  keyType: 'cpf_cnpj' | 'email' | 'phone' | 'random';
  key: string;
  beneficiary: string;
  city: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  plan: PlanType;
  subscription_status: SubscriptionStatus;
  billing_cycle: 'mensal';
  last_reset_date: string; // ISO string to track monthly budget reset
  created_at: string;
  pixData?: PixData;
}

export interface UsageLog {
  id: string;
  userId: string;
  activity: string;
  feature: string;
  status: 'success' | 'blocked';
  timestamp: string;
}

export const PLAN_LIMITS = {
  free: {
    name: 'Free',
    price: 'R$ 0',
    description: 'Ideal para quem está começando.',
    maxBudgets: 5,
    maxClients: 5,
    featureList: [
      { text: 'Até 5 orçamentos/mês', included: true },
      { text: 'Cadastro de até 5 clientes', included: true },
      { text: 'Exportação PDF simples', included: true },
      { text: 'Sem personalização', included: false },
    ],
    features: {
      create_budget: true,
      manage_clients: true,
      budget_link: 'simple',
      export_pdf: 'simple',
      whatsapp: false,
      payments: false,
      automations: false,
      ai: false,
      advanced_dashboard: false,
      customization: 'none',
    }
  },
  pro: {
    name: 'Pro',
    price: 'R$ 49,90',
    description: 'Para quem quer vender sem limites.',
    maxBudgets: Infinity,
    maxClients: Infinity,
    featureList: [
      { text: 'Orçamentos ilimitados', included: true },
      { text: 'Clientes ilimitados', included: true },
      { text: 'Botão WhatsApp', included: true },
      { text: 'PDF Profissional', included: true },
      { text: 'Personalização básica', included: true },
    ],
    features: {
      create_budget: true,
      manage_clients: true,
      budget_link: 'professional',
      export_pdf: 'professional',
      whatsapp: true,
      payments: false,
      automations: false,
      ai: false,
      advanced_dashboard: true,
      customization: 'basic',
    }
  },
  premium: {
    name: 'Premium',
    price: 'R$ 99,90',
    description: 'A solução completa com IA.',
    maxBudgets: Infinity,
    maxClients: Infinity,
    featureList: [
      { text: 'Tudo do Pro +', included: true },
      { text: 'Sugestões com IA', included: true },
      { text: 'Pagamentos (Pix/Link)', included: true },
      { text: 'Automação Follow-up', included: true },
      { text: 'Dashboard Avançado', included: true },
    ],
    features: {
      create_budget: true,
      manage_clients: true,
      budget_link: 'premium',
      export_pdf: 'premium',
      whatsapp: true,
      payments: true,
      automations: true,
      ai: true,
      advanced_dashboard: true,
      customization: 'full',
    }
  }
};

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  userId: string;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Budget {
  id: string;
  clientId: string;
  clientName: string;
  userId: string;
  professionalName?: string;
  professionalPhone?: string;
  professionalLogo?: string;
  items: BudgetItem[];
  total: number;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  date: string;
  expiry: string;
  observations: string;
  pixData?: PixData;
}

const STORAGE_KEYS = {
  USER: 'nexora_user',
  CLIENTS: 'nexora_clients',
  BUDGETS: 'nexora_budgets',
  LOGS: 'nexora_logs',
};

import { supabaseService } from '../services/supabaseService';

export const storage = {
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  setUser: async (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      // Sync with Supabase
      await supabaseService.updateProfile(user.id, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },
  updateUserPlan: async (plan: PlanType) => {
    const user = storage.getUser();
    if (user) {
      const updatedUser = { ...user, plan };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      await supabaseService.updateProfile(user.id, { plan });
      return updatedUser;
    }
    return null;
  },
  savePixData: async (userId: string, pixData: PixData) => {
    const user = storage.getUser();
    if (user && user.id === userId) {
      const updatedUser = { ...user, pixData };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      await supabaseService.updateProfile(userId, { pixData });
      return updatedUser;
    }
    return null;
  },

  logActivity: async (log: Omit<UsageLog, 'id' | 'timestamp'>) => {
    // Save to Supabase
    await supabaseService.logActivity(log);
    
    // Also keep in local storage for quick access if needed
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    const allLogs: UsageLog[] = data ? JSON.parse(data) : [];
    const newLog: UsageLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    allLogs.push(newLog);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
  },
  getLogs: async (userId: string): Promise<UsageLog[]> => {
    return await supabaseService.getLogs(userId);
  },
  clearLogs: (userId: string) => {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    // Note: Supabase doesn't have a clearLogs yet, we could add it if needed
  },

  getClients: async (userId: string): Promise<Client[]> => {
    return await supabaseService.getClients(userId);
  },
  saveClient: async (client: Client) => {
    await supabaseService.saveClient(client);
    
    // Sync local
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    const allClients: Client[] = data ? JSON.parse(data) : [];
    const index = allClients.findIndex(c => c.id === client.id);
    if (index >= 0) allClients[index] = client;
    else allClients.push(client);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(allClients));
  },
  deleteClient: async (id: string) => {
    await supabaseService.deleteClient(id);
    
    // Sync local
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    const allClients: Client[] = data ? JSON.parse(data) : [];
    const filtered = allClients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(filtered));
  },

  getBudgets: async (userId: string): Promise<Budget[]> => {
    return await supabaseService.getBudgets(userId);
  },
  getBudgetById: async (id: string): Promise<Budget | null> => {
    return await supabaseService.getBudgetById(id);
  },
  saveBudget: async (budget: Budget) => {
    await supabaseService.saveBudget(budget);
    
    // Sync local
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    const allBudgets: Budget[] = data ? JSON.parse(data) : [];
    const index = allBudgets.findIndex(b => b.id === budget.id);
    if (index >= 0) allBudgets[index] = budget;
    else allBudgets.push(budget);
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(allBudgets));
  },
  deleteBudget: async (id: string) => {
    await supabaseService.deleteBudget(id);
    
    // Sync local
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    const allBudgets: Budget[] = data ? JSON.parse(data) : [];
    const filtered = allBudgets.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filtered));
  },
  deleteUser: async (id: string) => {
    // Note: Deleting user from auth is more complex, usually handled via admin or self-delete
    // For now we just clear local and could call a function to delete profile
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  }
};
