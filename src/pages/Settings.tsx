import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Shield, CreditCard, Bell, Palette, Globe, Save, Zap, Sparkles, Check, Lock, X, Wallet, Camera, Trash2 } from "lucide-react";
import { storage, PLAN_LIMITS } from "../lib/storage";
import { cn } from "../lib/utils";
import { usePlan } from "../hooks/usePlan";
import UpgradeModal from "../components/UpgradeModal";
import PixSettings from "../components/PixSettings";

export default function Settings() {
  const { plan, checkAccess, isUpgradeModalOpen, blockedFeature, closeUpgradeModal } = usePlan();
  const user = storage.getUser();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (activeTab === "payments" && plan !== "premium") {
      setActiveTab("profile");
    }
  }, [plan, activeTab]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    company: user?.company || "Minha Empresa",
    phone: user?.phone || "(11) 99999-9999",
    primaryColor: user?.primaryColor || "#6C3BFF",
    secondaryColor: user?.secondaryColor || "#00CFFF",
    logo: user?.logo || "https://picsum.photos/seed/logo/100/100"
  });

  useEffect(() => {
    async function fetchData() {
      if (user?.id) {
        setLoading(true);
        try {
          const logs = await storage.getLogs(user.id);
          setUsageLogs(logs);
        } catch (error) {
          console.error("Error fetching logs:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [user?.id]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const updatedUser = {
        ...user,
        ...formData
      };
      
      await storage.setUser(updatedUser);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLogs = async () => {
    if (!user) return;
    try {
      await storage.clearLogs(user.id);
      setUsageLogs([]);
    } catch (error) {
      console.error("Error clearing logs:", error);
    }
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "plan", label: "Plano & Cobrança", icon: CreditCard },
    { id: "payments", label: "Pagamentos", icon: Wallet, premiumOnly: true },
    { id: "appearance", label: "Personalização", icon: Palette },
    { id: "logs", label: "Atividade", icon: Bell },
    { id: "security", label: "Segurança", icon: Shield },
  ];

  const visibleTabs = tabs.filter(tab => !tab.premiumOnly || plan === 'premium');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary px-6"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={18} /> Salvar Alterações
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-brand-purple/10 text-brand-purple border border-brand-purple/20 shadow-[0_0_15px_rgba(108,59,255,0.1)]" 
                  : "text-text-secondary hover:bg-white/5"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 space-y-8"
          >
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      id="logo-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer block">
                      <div className="relative">
                        <img 
                          src={formData.logo} 
                          alt="Avatar" 
                          className="w-20 h-20 rounded-2xl border-2 border-white/10 group-hover:border-brand-pink transition-colors object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                          <Camera size={20} className="text-white" />
                        </div>
                        <div className={cn(
                          "absolute -bottom-2 -right-2 p-2 bg-brand-pink text-white rounded-lg shadow-lg transition-all duration-300",
                          formData.logo.includes('picsum.photos') ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          <Camera size={14} />
                        </div>
                        {formData.logo && !formData.logo.includes('picsum.photos') && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData({ ...formData, logo: "https://picsum.photos/seed/logo/100/100" });
                            }}
                            className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </label>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{formData.name}</h3>
                    <p className="text-sm text-text-secondary">Membro desde Abril 2024</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Nome Completo</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">E-mail</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Empresa</label>
                    <input 
                      type="text" 
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">WhatsApp</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "plan" && (
              <div className="space-y-8">
                <div className="p-6 rounded-2xl bg-brand-gradient-to-r from-brand-purple/20 to-brand-pink/20 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center text-brand-purple">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">Plano {plan.toUpperCase()}</h3>
                      <p className="text-sm text-text-secondary">Próxima cobrança em 15 de Maio, 2024</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {plan !== 'free' && (
                      <button 
                        onClick={async () => {
                          if (user) {
                            await storage.setUser({ ...user, plan: 'free' });
                            window.location.reload();
                          }
                        }}
                        className="btn-outline px-4 py-2 text-xs"
                      >
                        Downgrade para Free
                      </button>
                    )}
                    {plan !== 'pro' && (
                      <button 
                        onClick={async () => {
                          if (user) {
                            await storage.setUser({ ...user, plan: 'pro' });
                            window.location.reload();
                          }
                        }}
                        className="btn-primary px-4 py-2 text-xs"
                      >
                        Mudar para Pro
                      </button>
                    )}
                    {plan !== 'premium' && (
                      <button 
                        onClick={async () => {
                          if (user) {
                            await storage.setUser({ ...user, plan: 'premium' });
                            window.location.reload();
                          }
                        }}
                        className="bg-white text-background hover:bg-white/90 px-4 py-2 text-xs font-bold rounded-xl transition-all"
                      >
                        Mudar para Premium
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {(Object.entries(PLAN_LIMITS) as [string, any][]).map(([key, p]) => (
                    <div 
                      key={key}
                      className={cn(
                        "p-6 rounded-2xl border transition-all relative",
                        plan === key ? "bg-white/10 border-brand-pink shadow-lg shadow-brand-pink/10" : "bg-white/5 border-white/10 opacity-60"
                      )}
                    >
                      {key === 'pro' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-pink text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                          Popular
                        </div>
                      )}
                      <h4 className="font-bold text-white mb-1">{p.name}</h4>
                      <p className="text-2xl font-bold text-brand-pink mb-1">{p.price}<span className="text-xs text-text-secondary font-normal">/mês</span></p>
                      <p className="text-xs text-text-secondary mb-6">{p.description}</p>
                      
                      <ul className="space-y-3">
                        {p.featureList?.map((feature: any, idx: number) => (
                          <li key={idx} className={cn(
                            "flex items-center gap-3 text-xs",
                            feature.included ? "text-text-secondary" : "text-text-secondary/40"
                          )}>
                            {feature.included ? (
                              <Check size={14} className="text-brand-pink shrink-0" />
                            ) : (
                              <X size={14} className="shrink-0" />
                            )}
                            {feature.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <PixSettings 
                user={user} 
                onSave={() => {
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                }} 
              />
            )}

            {activeTab === "appearance" && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-white">Identidade Visual</h3>
                  <p className="text-sm text-text-secondary">Personalize as cores e a marca dos seus orçamentos.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Cor Primária</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                        className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Cor Secundária</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                        className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                {plan === 'free' && (
                  <div className="p-6 rounded-2xl bg-brand-gold/5 border border-brand-gold/20 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                      <Sparkles size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-white">Personalização Completa</h4>
                      <p className="text-xs text-text-secondary">Faça o upgrade para o plano Premium para liberar cores personalizadas e remover a marca Nexora.</p>
                    </div>
                    <button 
                      onClick={async () => await checkAccess('customization')}
                      className="text-xs font-bold text-brand-gold hover:underline"
                    >
                      Upgrade
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "logs" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white">Atividade da Conta</h3>
                  <button 
                    onClick={handleClearLogs}
                    className="text-xs text-text-secondary hover:text-white"
                  >
                    Limpar Histórico
                  </button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {usageLogs.length === 0 ? (
                    <div className="text-center py-12 text-text-secondary">
                      Nenhuma atividade registrada ainda.
                    </div>
                  ) : (
                    usageLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            log.status === 'success' ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                          )}>
                            {log.status === 'success' ? <Check size={18} /> : <Lock size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white capitalize">
                              {log.feature.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {new Date(log.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-md uppercase",
                          log.status === 'success' ? "text-green-400 bg-green-400/5" : "text-red-400 bg-red-400/5"
                        )}>
                          {log.status === 'success' ? 'Sucesso' : 'Bloqueado'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Senha Atual</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Nova Senha</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Confirmar Nova Senha</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <button 
                    type="button"
                    onClick={() => {
                      if (user) {
                        storage.deleteUser(user.id);
                        window.location.reload();
                      }
                    }}
                    className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                  >
                    Excluir minha conta permanentemente
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-green-500 text-white rounded-full font-bold shadow-2xl flex items-center gap-2"
          >
            <Check size={20} /> Alterações salvas com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={closeUpgradeModal} 
        featureName={blockedFeature?.name}
        targetPlan={blockedFeature?.target}
      />
    </div>
  );
}
