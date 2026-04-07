import { useState } from "react";
import { motion } from "motion/react";
import { Check, CreditCard, Lock, Sparkles, AlertCircle, ChevronDown } from "lucide-react";
import { storage, PixData, User } from "../lib/storage";
import { cn } from "../lib/utils";
import CustomSelect from "./CustomSelect";

interface PixConfigProps {
  user: User | null;
  onSave: () => void;
}

export default function PixSettings({ user, onSave }: PixConfigProps) {
  const isPremium = user?.plan === 'premium';
  
  const [formData, setFormData] = useState<PixData>({
    keyType: user?.pixData?.keyType || 'cpf_cnpj',
    key: user?.pixData?.key || '',
    beneficiary: user?.pixData?.beneficiary || user?.name || '',
    city: user?.pixData?.city || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!isPremium) return;
    
    setError(null);
    if (!formData.key || !formData.beneficiary || !formData.city) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Validations
    if (formData.keyType === 'cpf_cnpj') {
      const digits = formData.key.replace(/\D/g, '');
      if (digits.length !== 11 && digits.length !== 14) {
        setError("CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.");
        return;
      }
      // Update key to digits only for storage
      formData.key = digits;
    } else if (formData.keyType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.key.trim())) {
        setError("Por favor, insira um e-mail válido.");
        return;
      }
      formData.key = formData.key.trim().toLowerCase();
    } else if (formData.keyType === 'phone') {
      const digits = formData.key.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        setError("Telefone deve ter DDD + 8 ou 9 dígitos.");
        return;
      }
      // Phone will be formatted in generatePixPayload
    }

    setIsSaving(true);
    
    try {
      if (user) {
        await storage.savePixData(user.id, formData);
        onSave();
      }
    } catch (error) {
      console.error("Error saving Pix data:", error);
      setError("Erro ao salvar dados do Pix. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl text-white flex items-center gap-2">
              <CreditCard className="text-brand-purple" size={24} />
              Pagamento via Pix
            </h3>
            <p className="text-sm text-text-secondary">Configure sua chave Pix para receber pagamentos nos orçamentos.</p>
          </div>
          {!isPremium && (
            <div className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={12} /> Premium
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        {!isPremium && (
          <div className="absolute inset-0 z-10 bg-[#0A0F1C]/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center p-8 border border-white/5 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-6 rotate-12">
              <Lock size={40} />
            </div>
            <h4 className="text-2xl font-black text-white mb-3 tracking-tight">Recurso Premium</h4>
            <p className="text-text-secondary text-sm max-w-xs mb-8 leading-relaxed">
              Ative pagamentos via Pix e receba de seus clientes de forma rápida, profissional e automática.
            </p>
            <button 
              onClick={async () => {
                if (user) {
                  await storage.setUser({ ...user, plan: 'premium' });
                  window.location.reload();
                }
              }}
              className="bg-brand-gold text-background px-10 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,215,0,0.3)] uppercase tracking-widest text-xs"
            >
              Fazer Upgrade Agora
            </button>
          </div>
        )}

        <div className={cn("space-y-8 transition-all duration-500", !isPremium && "opacity-20 blur-sm pointer-events-none")}>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Tipo de Chave Pix</label>
              <CustomSelect 
                options={[
                  { id: 'cpf_cnpj', name: 'CPF / CNPJ' },
                  { id: 'email', name: 'E-mail' },
                  { id: 'phone', name: 'Telefone (DDD + Número)' },
                  { id: 'random', name: 'Chave Aleatória (EVP)' }
                ]}
                value={formData.keyType}
                onChange={(val) => setFormData({...formData, keyType: val as any})}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Chave Pix</label>
              <input 
                type="text" 
                placeholder={formData.keyType === 'phone' ? "(11) 99999-9999" : "Insira sua chave aqui..."}
                value={formData.key}
                onChange={(e) => setFormData({...formData, key: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 transition-all font-medium"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Nome do Beneficiário</label>
              <input 
                type="text" 
                placeholder="Ex: Nexora Tecnologia LTDA"
                value={formData.beneficiary}
                onChange={(e) => setFormData({...formData, beneficiary: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 transition-all font-medium"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Cidade (Sem acentos)</label>
              <input 
                type="text" 
                placeholder="Ex: SAO PAULO"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 transition-all font-medium"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 text-red-400 text-sm bg-red-400/10 p-4 rounded-2xl border border-red-400/20"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-medium">{error}</p>
            </motion.div>
          )}

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-brand-purple text-white py-5 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(108,59,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            {isSaving ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={24} /> Salvar Configurações Pix
              </>
            )}
          </button>
        </div>
      </div>

      {user?.pixData && isPremium && (
        <div className="p-4 rounded-xl bg-green-400/5 border border-green-400/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-400/10 flex items-center justify-center text-green-400">
            <Check size={18} />
          </div>
          <p className="text-sm text-text-secondary">Sua chave Pix está configurada e ativa para novos orçamentos.</p>
        </div>
      )}
    </div>
  );
}
