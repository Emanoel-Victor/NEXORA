import { supabase } from '../lib/supabase';
import { User, Client, Budget, UsageLog, PlanType, PixData } from '../lib/storage';

export const supabaseService = {
  // --- Profiles ---
  getProfile: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      console.error('Error fetching profile:', error);
      return null;
    }

    // Map DB fields to User interface
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      company: data.company,
      phone: data.phone,
      logo: data.logo,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      plan: data.plan as PlanType,
      subscription_status: data.subscription_status,
      billing_cycle: data.billing_cycle,
      last_reset_date: data.last_reset_date,
      created_at: data.created_at,
      pixData: data.pix_data as PixData
    };
  },

  createProfile: async (profile: Partial<User> & { id: string; name: string; email: string }): Promise<User> => {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        company: profile.company || '',
        phone: profile.phone || '',
        logo: profile.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
        plan: profile.plan || 'free',
        subscription_status: 'ativo',
        billing_cycle: 'mensal'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      company: data.company,
      phone: data.phone,
      logo: data.logo,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      plan: data.plan as PlanType,
      subscription_status: data.subscription_status,
      billing_cycle: data.billing_cycle,
      last_reset_date: data.last_reset_date,
      created_at: data.created_at,
      pixData: data.pix_data as PixData
    };
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    // Map User interface to DB fields
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.email) dbUpdates.email = updates.email;
    if (updates.company) dbUpdates.company = updates.company;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.logo) dbUpdates.logo = updates.logo;
    if (updates.primaryColor) dbUpdates.primary_color = updates.primaryColor;
    if (updates.secondaryColor) dbUpdates.secondary_color = updates.secondaryColor;
    if (updates.plan) dbUpdates.plan = updates.plan;
    if (updates.subscription_status) dbUpdates.subscription_status = updates.subscription_status;
    if (updates.pixData) dbUpdates.pix_data = updates.pixData;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- Clients ---
  getClients: async (userId: string): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }

    return data.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      userId: c.user_id,
      createdAt: c.created_at
    }));
  },

  saveClient: async (client: Client) => {
    const { error } = await supabase
      .from('clients')
      .upsert({
        id: client.id,
        user_id: client.userId,
        name: client.name,
        email: client.email,
        phone: client.phone,
        created_at: client.createdAt
      });

    if (error) throw error;
  },

  deleteClient: async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- Budgets ---
  getBudgets: async (userId: string): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching budgets:', error);
      return [];
    }

    return data.map(b => ({
      id: b.id,
      clientId: b.client_id,
      clientName: b.client_name,
      userId: b.user_id,
      professionalName: b.professional_name,
      professionalPhone: b.professional_phone,
      professionalLogo: b.professional_logo,
      items: b.items,
      total: b.total,
      status: b.status,
      date: b.date,
      expiry: b.expiry,
      observations: b.observations,
      pixData: b.pix_data
    }));
  },

  getBudgetById: async (id: string): Promise<Budget | null> => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching budget:', error);
      return null;
    }

    return {
      id: data.id,
      clientId: data.client_id,
      clientName: data.client_name,
      userId: data.user_id,
      professionalName: data.professional_name,
      professionalPhone: data.professional_phone,
      professionalLogo: data.professional_logo,
      items: data.items,
      total: data.total,
      status: data.status,
      date: data.date,
      expiry: data.expiry,
      observations: data.observations,
      pixData: data.pix_data
    };
  },

  saveBudget: async (budget: Budget) => {
    const { error } = await supabase
      .from('budgets')
      .upsert({
        id: budget.id,
        user_id: budget.userId,
        client_id: budget.clientId,
        client_name: budget.clientName,
        professional_name: budget.professionalName,
        professional_phone: budget.professionalPhone,
        professional_logo: budget.professionalLogo,
        items: budget.items,
        total: budget.total,
        status: budget.status,
        date: budget.date,
        expiry: budget.expiry,
        observations: budget.observations,
        pix_data: budget.pixData
      });

    if (error) throw error;
  },

  deleteBudget: async (id: string) => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- Logs ---
  logActivity: async (log: Omit<UsageLog, 'id' | 'timestamp'>) => {
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: log.userId,
        activity: log.activity,
        feature: log.feature,
        status: log.status
      });

    if (error) console.error('Error logging activity:', error);
  },

  getLogs: async (userId: string): Promise<UsageLog[]> => {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }

    return data.map(l => ({
      id: l.id,
      userId: l.user_id,
      activity: l.activity,
      feature: l.feature,
      status: l.status,
      timestamp: l.timestamp
    }));
  }
};
