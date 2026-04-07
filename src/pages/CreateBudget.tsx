import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Save, Send, Share2, Sparkles, ChevronRight, ChevronLeft, Check, Calculator, Info, Zap, ChevronDown } from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { storage, Budget, BudgetItem, Client } from "../lib/storage";
import { usePlan } from "../hooks/usePlan";
import UpgradeModal from "../components/UpgradeModal";
import CustomSelect from "../components/CustomSelect";

const BudgetItemRow = memo(({ item, updateItem, removeItem }: { 
  item: BudgetItem; 
  updateItem: (id: string, field: keyof BudgetItem, value: any) => void;
  removeItem: (id: string) => void;
}) => (
  <div className="flex flex-col md:flex-row gap-4 p-4 bg-white/5 rounded-xl border border-border group relative">
    <div className="flex-1 space-y-2">
      <label className="text-xs font-bold text-text-secondary uppercase">Serviço / Produto</label>
      <input
        type="text"
        value={item.name}
        onChange={(e) => updateItem(item.id, "name", e.target.value)}
        placeholder="Ex: Consultoria de Marketing"
        className="input-field py-2"
      />
    </div>
    <div className="w-full md:w-24 space-y-2">
      <label className="text-xs font-bold text-text-secondary uppercase">Qtd</label>
      <input
        type="number"
        min="1"
        value={item.quantity}
        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
        className="input-field py-2"
      />
    </div>
    <div className="w-full md:w-40 space-y-2">
      <label className="text-xs font-bold text-text-secondary uppercase">Valor Unit.</label>
      <input
        type="number"
        step="0.01"
        value={item.price}
        onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
        className="input-field py-2"
      />
    </div>
    <button
      onClick={() => removeItem(item.id)}
      className="absolute -top-2 -right-2 md:static md:mt-8 p-2 bg-red-400/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-400 hover:text-white"
    >
      <Trash2 size={18} />
    </button>
  </div>
));

BudgetItemRow.displayName = "BudgetItemRow";

export default function CreateBudget() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plan, checkAccess, openUpgradeModal, isUpgradeModalOpen, blockedFeature, closeUpgradeModal } = usePlan();
  const user = storage.getUser();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([
    { id: "1", name: "", quantity: 1, price: 0 }
  ]);
  const [observations, setObservations] = useState("");
  const [splitValue, setSplitValue] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (user?.id) {
        setLoading(true);
        try {
          const fetchedClients = await storage.getClients(user.id);
          setClients(fetchedClients);

          if (id) {
            const budget = await storage.getBudgetById(id);
            if (budget) {
              setClientId(budget.clientId);
              setItems(budget.items);
              setObservations(budget.observations);
            }
          }
        } catch (error) {
          console.error("Error fetching data for budget creation:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [id, user?.id]);

  const total = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: "", quantity: 1, price: 0 }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  }, []);

  const updateItem = useCallback((id: string, field: keyof BudgetItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  const handleSave = async () => {
    if (!user || !clientId) return;

    // Check limit on save if it's a new budget
    if (!id && plan === 'free') {
      const budgets = await storage.getBudgets(user.id);
      if (budgets.length >= 5) {
        await checkAccess('create_budget');
        return;
      }
    }

    setIsSaving(true);

    try {
      const client = clients.find(c => c.id === clientId);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      const budget: Budget = {
        id: id || Math.random().toString(36).substr(2, 9),
        clientId,
        clientName: client?.name || "Cliente",
        userId: user.id,
        professionalName: user.name,
        professionalPhone: user.phone,
        professionalLogo: user.logo,
        items,
        total,
        status: "Pendente",
        date: new Date().toLocaleDateString('en-CA'),
        expiry: expiryDate.toLocaleDateString('en-CA'),
        observations,
        pixData: user.pixData
      };

      await storage.saveBudget(budget);
      navigate(`/view/${budget.id}`);
    } catch (error) {
      console.error("Error saving budget:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAISuggestion = async () => {
    if (plan !== 'premium') {
      openUpgradeModal('premium', 'Sugestões com IA');
      return;
    }
    
    setIsGeneratingAI(true);
    // Simulate AI generation
    setTimeout(() => {
      const suggestion = `Sugestão da Nexora AI para ${clients.find(c => c.id === clientId)?.name || 'este cliente'}: 
Este orçamento inclui materiais de alta qualidade e mão de obra especializada. 
Garantia de 12 meses para todos os serviços executados. 
Condições de pagamento: 50% de entrada e o restante na entrega ou parcelamento em até 3x sem juros.`;
      setObservations(suggestion);
      setIsGeneratingAI(false);
    }, 1500);
  };

  const steps = [
    { number: 1, label: "Cliente" },
    { number: 2, label: "Itens" },
    { number: 3, label: "Revisão" },
  ];
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{id ? "Editar Orçamento" : "Novo Orçamento"}</h1>
          <p className="text-sm text-text-secondary">Crie um orçamento profissional em poucos passos.</p>
        </div>
        
        {/* Steps Indicator */}
        <div className="flex items-center gap-1 md:gap-4">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div className={cn(
                "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-sm font-bold transition-all",
                step >= s.number ? "bg-brand-gradient text-white shadow-lg shadow-brand-pink/20" : "bg-white/10 text-text-secondary"
              )}>
                {step > s.number ? <Check size={12} className="md:w-4 md:h-4" /> : s.number}
              </div>
              <span className={cn(
                "ml-1.5 md:ml-2 text-[10px] md:text-sm font-medium hidden xs:inline",
                step >= s.number ? "text-white" : "text-text-secondary"
              )}>{s.label}</span>
              {i < steps.length - 1 && <div className="w-2 md:w-8 h-px bg-white/10 mx-1 md:mx-4" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card p-8 space-y-6"
              >
                <h2 className="text-xl font-bold mb-6">Selecione o Cliente</h2>
                <div className="space-y-4">
                  <label className="text-sm font-medium ml-1">Cliente</label>
                  <CustomSelect 
                    options={clients.map(c => ({ id: c.id, name: c.name }))}
                    value={clientId}
                    onChange={setClientId}
                    placeholder="Selecione um cliente..."
                  />
                  <button 
                    onClick={() => navigate('/clients')}
                    className="text-sm text-brand-pink hover:underline flex items-center gap-2"
                  >
                    <Plus size={16} /> Cadastrar novo cliente
                  </button>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!clientId}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo Passo <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="glass-card p-8 space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Itens do Orçamento</h2>
                    <button onClick={addItem} className="text-sm text-brand-pink hover:underline flex items-center gap-2">
                      <Plus size={16} /> Adicionar Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => (
                      <BudgetItemRow 
                        key={item.id} 
                        item={item} 
                        updateItem={updateItem} 
                        removeItem={removeItem} 
                      />
                    ))}
                  </div>

                  {/* AI Suggestion Simulation */}
                  <div className="p-4 bg-brand-pink/5 border border-brand-pink/20 rounded-xl flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-pink/10 flex items-center justify-center text-brand-pink shrink-0">
                      {isGeneratingAI ? (
                        <div className="w-5 h-5 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1">Sugestão Inteligente</h4>
                      <p className="text-xs text-text-secondary mb-2">
                        {isGeneratingAI ? "Gerando sugestão personalizada..." : "Baseado em orçamentos similares, podemos sugerir termos e descrições ideais."}
                      </p>
                      <button 
                        onClick={handleAISuggestion}
                        disabled={isGeneratingAI}
                        className={cn(
                          "text-xs font-bold hover:underline",
                          plan === 'premium' ? "text-brand-pink" : "text-brand-gold"
                        )}
                      >
                        {plan === 'premium' ? 'Aplicar sugestão com IA' : 'Desbloquear IA (Premium)'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8 space-y-6">
                  <h2 className="text-xl font-bold mb-6">Observações</h2>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Condições de pagamento, prazos, etc..."
                    className="input-field min-h-[120px] resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="btn-outline flex-1">
                    <ChevronLeft size={20} /> Voltar
                  </button>
                  <button onClick={() => setStep(3)} className="btn-primary flex-1">
                    Revisar Orçamento <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="glass-card p-8 space-y-8">
                  <div className="flex items-center justify-between border-b border-border pb-6">
                    <h2 className="text-2xl font-bold">Resumo Final</h2>
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">Total do Orçamento</p>
                      <p className="text-3xl font-bold text-brand-gradient">{formatCurrency(total)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-text-secondary uppercase text-xs tracking-widest">Itens Selecionados</h3>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                          <div>
                            <p className="font-medium text-white">{item.name || "Item sem nome"}</p>
                            <p className="text-xs text-text-secondary">{item.quantity}x {formatCurrency(item.price)}</p>
                          </div>
                          <p className="font-bold text-white">{formatCurrency(item.quantity * item.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Calculator size={16} />
                        Dividir valor entre participantes?
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={splitValue}
                        onChange={(e) => setSplitValue(parseInt(e.target.value) || 1)}
                        className="w-16 bg-transparent border-b border-brand-pink text-center focus:outline-none font-bold text-white"
                      />
                    </div>
                    {splitValue > 1 && (
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <p className="text-sm font-medium">Valor por pessoa:</p>
                        <p className="text-xl font-bold text-brand-gold">{formatCurrency(total / splitValue)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={() => setStep(2)} className="btn-outline flex-1">
                    <ChevronLeft size={20} /> Ajustar Itens
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex-[2] relative overflow-hidden"
                  >
                    {isSaving ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={20} /> Salvar e Gerar Link
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Info size={18} className="text-brand-pink" />
              Por que usar a Nexora?
            </h3>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex gap-2">
                <Check size={16} className="text-green-400 shrink-0" />
                Orçamentos profissionais convertem 40% mais.
              </li>
              <li className="flex gap-2">
                <Check size={16} className="text-green-400 shrink-0" />
                Seu cliente aprova direto pelo WhatsApp.
              </li>
              <li className="flex gap-2">
                <Check size={16} className="text-green-400 shrink-0" />
                Acompanhe quem visualizou seu link.
              </li>
            </ul>
          </div>

          <div className="glass-card p-6 bg-brand-orange/5 border-brand-orange/20">
            <h3 className="font-bold text-brand-orange mb-2 flex items-center gap-2">
              <Sparkles size={18} />
              Dica de Conversão
            </h3>
            <p className="text-sm text-text-secondary">
              Adicione um prazo de validade nas observações para criar senso de urgência no seu cliente.
            </p>
            {plan === 'free' && (
              <button 
                onClick={() => openUpgradeModal('pro')}
                className="mt-4 w-full py-2 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-lg hover:bg-brand-orange/20 transition-all"
              >
                Remover limites do plano Free
              </button>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={closeUpgradeModal} 
        featureName={blockedFeature?.name}
        targetPlan={blockedFeature?.target}
      />
    </div>
  );
}
