import { motion, AnimatePresence } from "motion/react";
import { Plus, TrendingUp, Users, FileText, DollarSign, ArrowUpRight, Clock, Zap, Sparkles, BarChart3, PieChart as PieChartIcon, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency, cn } from "../lib/utils";
import { storage, Budget, Client } from "../lib/storage";
import { useEffect, useState, useMemo, memo } from "react";
import { usePlan } from "../hooks/usePlan";
import UpgradeModal from "../components/UpgradeModal";
import StatusBadge from "../components/StatusBadge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const StatCard = memo(({ stat, i, plan, checkAccess }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.1 }}
    onClick={stat.premium ? async () => await checkAccess('advanced_dashboard') : undefined}
    className={cn(
      "glass-card p-6 relative overflow-hidden group transition-all",
      stat.premium && "cursor-pointer hover:border-brand-pink/30"
    )}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
        <stat.icon size={24} />
      </div>
      {stat.premium ? (
        <span className="text-[10px] font-black bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded-full uppercase tracking-tighter">
          {plan === 'free' ? 'PRO' : 'PREMIUM'}
        </span>
      ) : (
        <span className="text-xs font-bold text-brand-pink flex items-center gap-1">
          +12% <ArrowUpRight size={12} />
        </span>
      )}
    </div>
    <div className="text-2xl font-bold mb-1">{stat.value}</div>
    <div className="text-sm text-text-secondary flex items-center justify-between">
      {stat.label}
      {stat.limit && (
        <span className="text-[10px] font-bold text-brand-pink">Limite: {stat.limit}</span>
      )}
    </div>
    {stat.limit && (
      <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-brand-pink transition-all duration-1000" 
          style={{ width: `${Math.min((Number(stat.value) / stat.limit) * 100, 100)}%` }} 
        />
      </div>
    )}
  </motion.div>
));

StatCard.displayName = "StatCard";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-skeleton"></div>
          <div className="h-4 w-64 bg-white/5 rounded-lg animate-skeleton"></div>
        </div>
        <div className="h-12 w-40 bg-white/5 rounded-xl animate-skeleton"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card p-6 h-32 animate-skeleton"></div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[400px] glass-card animate-skeleton"></div>
        <div className="h-[400px] glass-card animate-skeleton"></div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { plan, checkAccess, isUpgradeModalOpen, blockedFeature, closeUpgradeModal, limits } = usePlan();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const user = storage.getUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (user?.id) {
        setLoading(true);
        try {
          const [fetchedBudgets, fetchedClients] = await Promise.all([
            storage.getBudgets(user.id),
            storage.getClients(user.id)
          ]);
          setBudgets(fetchedBudgets);
          setClients(fetchedClients);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
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

  const totalApproved = budgets
    .filter(b => b.status === "Aprovado")
    .reduce((acc, b) => acc + b.total, 0);
  const conversionRate = budgets.length > 0 
    ? Math.round((budgets.filter(b => b.status === "Aprovado").length / budgets.length) * 100) 
    : 0;

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(selectedDate.getFullYear(), monthIndex, 1);
    setSelectedDate(newDate);
  };

  const budgetsInSelectedMonth = useMemo(() => {
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    return budgets.filter(b => {
      const parts = b.date.split('-');
      if (parts.length !== 3) return false;
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      return y === selectedYear && (m - 1) === selectedMonth;
    });
  }, [budgets, selectedDate]);

  const budgetsInPreviousMonth = useMemo(() => {
    const prevDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();
    return budgets.filter(b => {
      const parts = b.date.split('-');
      if (parts.length !== 3) return false;
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      return y === prevYear && (m - 1) === prevMonth;
    });
  }, [budgets, selectedDate]);

  const growth = useMemo(() => {
    const currentTotal = budgetsInSelectedMonth.reduce((acc, b) => acc + b.total, 0);
    const previousTotal = budgetsInPreviousMonth.reduce((acc, b) => acc + b.total, 0);
    
    if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
    return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  }, [budgetsInSelectedMonth, budgetsInPreviousMonth]);

  // Calculate daily chart data for the selected month
  const chartData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const data = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const budgetsOnDay = budgetsInSelectedMonth.filter(b => {
        const parts = b.date.split('-');
        if (parts.length !== 3) return false;
        const d = parseInt(parts[2]);
        return d === day;
      });

      const total = budgetsOnDay.reduce((acc, b) => acc + b.total, 0);
      const approved = budgetsOnDay
        .filter(b => b.status === 'Aprovado')
        .reduce((acc, b) => acc + b.total, 0);
      const rejected = budgetsOnDay
        .filter(b => b.status === 'Recusado')
        .reduce((acc, b) => acc + b.total, 0);

      data.push({
        name: dayStr,
        total,
        approved,
        rejected,
      });
    }

    return data;
  }, [budgetsInSelectedMonth, selectedDate]);

  const pieData = useMemo(() => [
    { name: 'Aprovados', value: budgets.filter(b => b.status === 'Aprovado').length, color: '#4ADE80' },
    { name: 'Pendentes', value: budgets.filter(b => b.status === 'Pendente').length, color: '#F59E0B' },
    { name: 'Recusados', value: budgets.filter(b => b.status === 'Recusado').length, color: '#F87171' },
  ], [budgets]);

  const stats = [
    { 
      label: "Total Aprovado", 
      value: plan === 'free' ? "---" : formatCurrency(totalApproved), 
      icon: DollarSign, 
      color: "text-brand-gold", 
      bg: "bg-brand-gold/10",
      premium: plan === 'free'
    },
    { 
      label: "Orçamentos", 
      value: budgets.length.toString(), 
      icon: FileText, 
      color: "text-brand-pink", 
      bg: "bg-brand-pink/10",
      limit: plan === 'free' ? 5 : undefined
    },
    { 
      label: "Clientes", 
      value: clients.length.toString(), 
      icon: Users, 
      color: "text-brand-orange", 
      bg: "bg-brand-orange/10",
      limit: plan === 'free' ? 5 : undefined
    },
    { 
      label: "Conversão", 
      value: plan === 'premium' ? `${conversionRate}%` : "---", 
      icon: TrendingUp, 
      color: "text-brand-purple", 
      bg: "bg-brand-purple/10",
      premium: plan !== 'premium'
    },
  ];

  const recentBudgets = [...budgets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const handleCreateBudget = async () => {
    if (await checkAccess('create_budget')) {
      navigate('/create');
    }
  };

  const handleFollowUp = async (clientName: string) => {
    if (!(await checkAccess('automations'))) return;
    setNotification({
      message: `Follow-up automático agendado para ${clientName} em 24h.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const hasAdvancedDashboard = plan === 'premium';

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Olá, {user?.name.split(' ')[0]}! 👋</h1>
          <p className="text-sm text-text-secondary">Aqui está o resumo do seu negócio hoje.</p>
        </div>
        <button onClick={handleCreateBudget} className="btn-primary w-full sm:w-auto">
          <Plus size={20} />
          Criar Orçamento
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} i={i} plan={plan} checkAccess={checkAccess} />
        ))}
      </div>

      {/* Advanced Dashboard Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Chart */}
          <div className="glass-card p-8 relative overflow-hidden">
            {!hasAdvancedDashboard && (
              <div 
                onClick={async () => await checkAccess('advanced_dashboard')}
                className="absolute inset-0 z-10 bg-background/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer group"
              >
                <div className="glass-card p-6 text-center scale-110 shadow-2xl border-brand-gold/30">
                  <Sparkles className="text-brand-gold mx-auto mb-3" size={32} />
                  <h3 className="font-bold text-white mb-1">Dashboard Avançado</h3>
                  <p className="text-xs text-text-secondary mb-4">Disponível apenas no plano PREMIUM</p>
                  <button className="btn-primary py-2 px-6 text-xs bg-brand-gold text-black border-none mx-auto">Desbloquear Agora</button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 sm:gap-6">
                <h3 className="text-sm md:text-base font-bold flex items-center gap-2 whitespace-nowrap">
                  <BarChart3 size={18} className="text-brand-pink" />
                  Desempenho de Vendas
                </h3>
                
                <div className="hidden sm:flex items-center gap-4 border-l border-white/10 pl-4 sm:pl-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-purple shadow-[0_0_8px_rgba(108,59,255,0.5)]" />
                    <span className="text-[9px] text-text-secondary uppercase font-bold tracking-wider">Gerado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                    <span className="text-[9px] text-text-secondary uppercase font-bold tracking-wider">Aprovado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                    <span className="text-[9px] text-text-secondary uppercase font-bold tracking-wider">Recusado</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="flex sm:hidden items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                </div>

                <div className="relative group">
                  <select 
                    value={selectedDate.getMonth()}
                    onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                    className="appearance-none bg-transparent text-sm text-text-secondary hover:text-white transition-colors pr-6 cursor-pointer focus:outline-none font-medium"
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i} className="bg-card text-white">{m}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <div className="h-full">
                {budgetsInSelectedMonth.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                    <FileText size={48} className="opacity-10 mb-4" />
                    <p className="text-sm">Nenhum dado neste mês</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6C3BFF" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6C3BFF" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4ADE80" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F87171" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 10 }} 
                        interval={0}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        width={80}
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0A0F1C', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                        }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94A3B8', marginBottom: '8px', fontSize: '10px' }}
                        labelFormatter={(label) => `Dia ${label}`}
                        formatter={(value: number) => [formatCurrency(value), ""]}
                      />
                      <Area 
                        name="Gerado"
                        type="monotone" 
                        dataKey="total" 
                        stroke="#6C3BFF" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorTotal)" 
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#6C3BFF' }}
                      />
                      <Area 
                        name="Aprovado"
                        type="monotone" 
                        dataKey="approved" 
                        stroke="#4ADE80" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorApproved)" 
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#4ADE80' }}
                      />
                      <Area 
                        name="Recusado"
                        type="monotone" 
                        dataKey="rejected" 
                        stroke="#F87171" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRejected)" 
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#F87171' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Recent Budgets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Orçamentos Recentes</h2>
              <Link to="/budgets" className="text-sm text-brand-pink hover:underline">Ver todos</Link>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-white/5">
                      <th className="px-6 py-4 text-sm font-semibold text-text-secondary">Cliente</th>
                      <th className="px-6 py-4 text-sm font-semibold text-text-secondary">Data</th>
                      <th className="px-6 py-4 text-sm font-semibold text-text-secondary">Total</th>
                      <th className="px-6 py-4 text-sm font-semibold text-text-secondary">Status</th>
                      <th className="px-6 py-4 text-sm font-semibold text-text-secondary text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentBudgets.length > 0 ? (
                      recentBudgets.map((budget) => (
                        <tr key={budget.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 font-medium text-white">{budget.clientName}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{budget.date}</td>
                          <td className="px-6 py-4 font-bold text-white">{formatCurrency(budget.total)}</td>
                          <td className="px-6 py-4">
                            <StatusBadge 
                              budget={budget} 
                              onStatusChange={refreshBudgets}
                            />
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleFollowUp(budget.clientName)}
                              className="p-2 hover:bg-brand-gold/10 text-text-secondary hover:text-brand-gold rounded-lg transition-all"
                              title="Follow-up Automático"
                            >
                              <Clock size={18} />
                            </button>
                            <Link to={`/view/${budget.id}`} className="p-2 hover:bg-brand-pink/10 hover:text-brand-pink rounded-lg transition-all inline-block">
                              <ArrowUpRight size={18} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                          Nenhum orçamento recente
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Conversion Pie Chart */}
          <div className="glass-card p-6 relative overflow-hidden">
            {!hasAdvancedDashboard && (
              <div 
                onClick={async () => await checkAccess('advanced_dashboard')}
                className="absolute inset-0 z-10 bg-background/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer"
              />
            )}
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <PieChartIcon size={18} className="text-brand-purple" />
              Status de Conversão
            </h3>
            <div className="h-[200px] w-full relative">
              {budgets.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm">
                  Sem dados para exibir
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A0F1C', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-2 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-text-secondary">{item.name}</span>
                  </div>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Info */}
          <div className="glass-card p-6 bg-brand-gradient relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
              <Zap size={80} className="text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30 uppercase">
                  PLANO {plan}
                </span>
              </div>
              
              {plan === 'free' ? (
                <>
                  <h3 className="text-lg font-bold mb-2 text-white">Você usou {budgets.length} de 5 orçamentos</h3>
                  <div className="w-full h-2 bg-black/20 rounded-full mb-6 overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min((budgets.length / 5) * 100, 100)}%` }} />
                  </div>
                  <p className="text-sm text-white/80 mb-6">
                    Faça o upgrade para o plano Pro e crie orçamentos ilimitados para fechar mais vendas.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-2 text-white">Orçamentos Ilimitados</h3>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">Assinatura Ativa</span>
                  </div>
                  <p className="text-sm text-white/80 mb-6">
                    Você tem acesso total a {plan === 'pro' ? 'todos os recursos essenciais' : 'todas as funcionalidades premium'}.
                  </p>
                </>
              )}
              
              <button 
                onClick={async () => await checkAccess(plan === 'free' ? 'create_budget' : 'ai')}
                className="w-full py-3 bg-white text-brand-purple font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg"
              >
                {plan === 'premium' ? 'Gerenciar Assinatura' : 'Fazer Upgrade'}
              </button>
            </div>
          </div>

          {/* Quick Tip */}
          <div className="glass-card p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0 glow-orange">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-bold mb-1 text-white">Dica do dia</h4>
                <p className="text-sm text-text-secondary">
                  Orçamentos enviados em até 30 minutos após o contato têm 4x mais chances de conversão.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={closeUpgradeModal} 
        featureName={blockedFeature?.name}
        targetPlan={blockedFeature?.target}
      />

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[100] bg-brand-pink text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(255,79,216,0.4)] flex items-center gap-2"
          >
            <Zap size={18} />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



