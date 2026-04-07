import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Search, FileText, ArrowUpRight, Clock, Filter, Calendar, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency, cn } from "../lib/utils";
import { storage, Budget } from "../lib/storage";
import { usePlan } from "../hooks/usePlan";
import UpgradeModal from "../components/UpgradeModal";
import StatusBadge from "../components/StatusBadge";

export default function Budgets() {
  const navigate = useNavigate();
  const { plan, checkAccess, isUpgradeModalOpen, blockedFeature, closeUpgradeModal } = usePlan();
  const user = storage.getUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (user?.id) {
        setLoading(true);
        try {
          const fetchedBudgets = await storage.getBudgets(user.id);
          setBudgets(fetchedBudgets);
        } catch (error) {
          console.error("Error fetching budgets:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [user?.id]);

  const refreshBudgets = async () => {
    if (user?.id) {
      const fetchedBudgets = await storage.getBudgets(user.id);
      setBudgets(fetchedBudgets);
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         budget.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || budget.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDeleteBudget = async (id: string) => {
    try {
      await storage.deleteBudget(id);
      await refreshBudgets();
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const handleCreateBudget = async () => {
    if (await checkAccess('create_budget')) {
      navigate('/create');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Orçamentos</h1>
          <p className="text-sm text-text-secondary">Gerencie todas as suas propostas comerciais.</p>
        </div>
        <button onClick={handleCreateBudget} className="btn-primary w-full sm:w-auto">
          <Plus size={20} />
          Novo Orçamento
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-pink transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0">
          {["Todos", "Pendente", "Aprovado", "Recusado"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                statusFilter === status
                  ? "bg-brand-pink/10 text-brand-pink border-brand-pink/30 shadow-lg shadow-brand-pink/10"
                  : "bg-white/5 text-text-secondary border-transparent hover:bg-white/10"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Budgets List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredBudgets.length > 0 ? (
          filteredBudgets.map((budget, i) => (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-brand-pink/30 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  budget.status === "Aprovado" ? "bg-green-400/10 text-green-400" :
                  budget.status === "Recusado" ? "bg-red-400/10 text-red-400" :
                  "bg-brand-gold/10 text-brand-gold"
                )}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{budget.clientName}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-1">
                    <span className="text-xs font-mono text-text-secondary">#{budget.id}</span>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Calendar size={12} />
                      {budget.date}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Clock size={12} />
                      Vence {budget.expiry}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2">
                <div className="text-xl font-bold text-white">{formatCurrency(budget.total)}</div>
                <div className="flex items-center gap-3">
                  <StatusBadge 
                    budget={budget} 
                    onStatusChange={refreshBudgets}
                  />
                  <div className="flex gap-1">
                    <Link 
                      to={`/view/${budget.id}`}
                      className="p-2 hover:bg-brand-pink/10 text-text-secondary hover:text-brand-pink rounded-lg transition-all"
                      title="Visualizar"
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                    <Link 
                      to={`/edit/${budget.id}`}
                      className="p-2 hover:bg-white/5 text-text-secondary hover:text-white rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </Link>
                    <button 
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="p-2 hover:bg-red-400/10 text-text-secondary hover:text-red-400 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-secondary">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Nenhum orçamento encontrado</h3>
            <p className="text-text-secondary mb-8">Comece criando seu primeiro orçamento profissional.</p>
            <button onClick={handleCreateBudget} className="btn-primary mx-auto">
              Criar Orçamento
            </button>
          </div>
        )}
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
