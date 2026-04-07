import { useState, useCallback } from 'react';
import { storage, PLAN_LIMITS, PlanType } from '../lib/storage';

export type FeatureType = 
  | 'create_budget' 
  | 'manage_clients' 
  | 'budget_link' 
  | 'export_pdf' 
  | 'whatsapp' 
  | 'payments' 
  | 'automations' 
  | 'ai' 
  | 'advanced_dashboard' 
  | 'customization';

export function usePlan() {
  const [user, setUserState] = useState(storage.getUser());
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<{ name: string; target: 'pro' | 'premium' } | null>(null);

  const refreshUser = useCallback(() => {
    setUserState(storage.getUser());
  }, []);

  const hasAccess = useCallback((feature: FeatureType): boolean => {
    if (!user) return false;
    const plan = user.plan;
    const limits = PLAN_LIMITS[plan];
    const featureValue = limits.features[feature as keyof typeof limits.features];
    
    if (typeof featureValue === 'boolean') return featureValue;
    if (typeof featureValue === 'string') return featureValue !== 'none';
    return false;
  }, [user]);

  const checkAccess = useCallback(async (feature: FeatureType, silent: boolean = false) => {
    const currentUser = storage.getUser();
    if (!currentUser) return false;

    const plan = currentUser.plan;
    const limits = PLAN_LIMITS[plan];
    const access = hasAccess(feature);

    if (!access && !silent) {
      // Determine which plan is needed
      let target: 'pro' | 'premium' = 'pro';
      if (['ai', 'automations', 'payments', 'advanced_dashboard', 'customization'].includes(feature)) {
        target = 'premium';
      }

      await storage.logActivity({
        userId: user.id,
        activity: `Tentativa de acesso bloqueada: ${feature}`,
        feature,
        status: 'blocked'
      });

      setBlockedFeature({ 
        name: feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), 
        target 
      });
      setIsUpgradeModalOpen(true);
      return false;
    }

    // Special check for numeric limits
    if (feature === 'create_budget' && plan === 'free') {
      const budgets = await storage.getBudgets(user.id);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      const monthlyBudgets = budgets.filter(b => {
        const parts = b.date.split('-');
        if (parts.length !== 3) return false;
        const bDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return bDate > thirtyDaysAgo;
      });
      
      if (monthlyBudgets.length >= limits.maxBudgets) {
        if (!silent) {
          await storage.logActivity({
            userId: user.id,
            activity: 'Limite de orçamentos atingido',
            feature: 'create_budget',
            status: 'blocked'
          });
          setBlockedFeature({ name: 'Limite de 5 orçamentos mensais atingido', target: 'pro' });
          setIsUpgradeModalOpen(true);
        }
        return false;
      }
    }

    if (feature === 'manage_clients' && plan === 'free') {
      const clients = await storage.getClients(user.id);
      if (clients.length >= limits.maxClients) {
        if (!silent) {
          await storage.logActivity({
            userId: user.id,
            activity: 'Limite de clientes atingido',
            feature: 'manage_clients',
            status: 'blocked'
          });
          setBlockedFeature({ name: `Limite de ${limits.maxClients} clientes atingido`, target: 'pro' });
          setIsUpgradeModalOpen(true);
        }
        return false;
      }
    }

    if (access) {
      await storage.logActivity({
        userId: user.id,
        activity: `Acesso concedido: ${feature}`,
        feature,
        status: 'success'
      });
    }

    return access;
  }, [user, hasAccess]);

  const openUpgradeModal = (target: 'pro' | 'premium' = 'pro', featureName?: string) => {
    setBlockedFeature({ 
      name: featureName || (target === 'pro' ? 'Plano Pro' : 'Plano Premium'), 
      target 
    });
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
    setBlockedFeature(null);
  };

  return {
    user,
    plan: user?.plan || 'free',
    limits: user ? PLAN_LIMITS[user.plan] : PLAN_LIMITS.free,
    checkAccess,
    openUpgradeModal,
    isUpgradeModalOpen,
    blockedFeature,
    closeUpgradeModal,
    refreshUser
  };
}
