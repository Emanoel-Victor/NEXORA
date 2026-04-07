import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import { PlanType, PLAN_LIMITS, storage } from '../lib/storage';
import { cn } from '../lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  targetPlan?: 'pro' | 'premium';
}

export default function UpgradeModal({ isOpen, onClose, featureName, targetPlan = 'pro' }: UpgradeModalProps) {
  const plans = [
    {
      id: 'pro',
      ...PLAN_LIMITS.pro,
      color: 'brand-pink',
      icon: Zap
    },
    {
      id: 'premium',
      ...PLAN_LIMITS.premium,
      color: 'brand-gold',
      icon: Sparkles
    }
  ];

  const handleUpgrade = async (planId: PlanType) => {
    const user = storage.getUser();
    if (!user) return;

    const proUrl = import.meta.env.VITE_PERFECT_PAY_PRO_CHECKOUT_URL;
    const premiumUrl = import.meta.env.VITE_PERFECT_PAY_PREMIUM_CHECKOUT_URL;

    const checkoutUrl = planId === 'pro' ? proUrl : premiumUrl;

    if (checkoutUrl) {
      // Redirect to Perfect Pay with user ID as a parameter
      const separator = checkoutUrl.includes('?') ? '&' : '?';
      window.open(`${checkoutUrl}${separator}us_id=${user.id}`, '_blank');
      onClose();
    } else {
      // Fallback to mock upgrade if no URL is configured
      await storage.updateUserPlan(planId);
      onClose();
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-background border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-text-secondary transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="p-8 md:p-12">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-pink/10 text-brand-pink text-xs font-bold border border-brand-pink/20 mb-4">
                  <ShieldCheck size={14} /> UPGRADE DISPONÍVEL
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                  {featureName ? `Desbloqueie ${featureName}` : 'Escolha o plano ideal para você'}
                </h2>
                <p className="text-text-secondary max-w-xl mx-auto">
                  Essa funcionalidade está disponível nos planos pagos. Escolha o que melhor se adapta ao seu negócio.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`glass-card p-8 flex flex-col border-2 transition-all ${
                      targetPlan === plan.id ? 'border-brand-pink/50 bg-brand-pink/5' : 'border-white/5'
                    }`}
                  >
                    <div className="mb-8">
                      <div className={`w-12 h-12 rounded-2xl bg-${plan.color}/10 flex items-center justify-center text-${plan.color} mb-6`}>
                        <plan.icon size={28} />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold mb-4">{plan.price}<span className="text-lg text-text-secondary font-normal">/mês</span></div>
                      <p className="text-text-secondary text-sm">{plan.description}</p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {plan.featureList.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                          <CheckCircle2 size={18} className={`text-${plan.color} shrink-0 mt-0.5`} />
                          {feature.text}
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={() => handleUpgrade(plan.id as PlanType)}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold transition-all shadow-lg",
                        plan.id === 'pro' 
                          ? "btn-primary shadow-brand-pink/20" 
                          : "bg-transparent border-2 border-brand-gold text-brand-gold hover:bg-brand-gold/10 shadow-brand-gold/10"
                      )}
                    >
                      Assinar {plan.name}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <p className="text-sm text-text-secondary">
                  Precisa de ajuda? <button className="text-brand-pink font-bold hover:underline">Fale com nosso suporte</button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
