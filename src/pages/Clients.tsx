import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, Mail, Phone, MoreVertical, Edit2, Trash2, UserPlus, X, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { storage, Client } from "../lib/storage";
import { usePlan } from "../hooks/usePlan";
import UpgradeModal from "../components/UpgradeModal";

export default function Clients() {
  const { plan, checkAccess, isUpgradeModalOpen, blockedFeature, closeUpgradeModal } = usePlan();
  const user = storage.getUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [clients, setClients] = useState<Client[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (user?.id) {
        setLoading(true);
        try {
          const [fetchedClients, fetchedBudgets] = await Promise.all([
            storage.getClients(user.id),
            storage.getBudgets(user.id)
          ]);
          setClients(fetchedClients);
          setBudgets(fetchedBudgets);
        } catch (error) {
          console.error("Error fetching clients:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const refreshClients = async () => {
    if (user?.id) {
      const fetchedClients = await storage.getClients(user.id);
      setClients(fetchedClients);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    try {
      if (editingClient) {
        const updatedClient: Client = {
          ...editingClient,
          name: newClient.name,
          email: newClient.email,
          phone: newClient.phone,
        };
        await storage.saveClient(updatedClient);
      } else {
        // Generate a valid UUID v4
        const id = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

        const client: Client = {
          id,
          name: newClient.name,
          email: newClient.email,
          phone: newClient.phone,
          userId: user.id,
          createdAt: new Date().toISOString()
        };
        await storage.saveClient(client);
      }

      await refreshClients();
      setIsModalOpen(false);
      setEditingClient(null);
      setNewClient({ name: "", email: "", phone: "" });
    } catch (err: any) {
      console.error("Error saving client:", err);
      setError("Erro ao salvar cliente. Verifique os dados e tente novamente.");
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setNewClient({ name: client.name, email: client.email, phone: client.phone });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await storage.deleteClient(id);
      await refreshClients();
      setActiveMenuId(null);
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const handleOpenAddModal = async () => {
    if (plan === 'free' && clients.length >= 5) {
      await checkAccess('manage_clients');
    } else {
      setEditingClient(null);
      setNewClient({ name: "", email: "", phone: "" });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Clientes</h1>
          <p className="text-sm text-text-secondary">Gerencie sua base de contatos.</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn-primary w-full sm:w-auto">
          <UserPlus size={20} />
          Novo Cliente
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-pink transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
        {plan === 'free' && (
          <div className="px-4 py-2 rounded-xl bg-brand-pink/10 border border-brand-pink/20 flex items-center gap-2 text-xs font-bold text-brand-pink">
            {clients.length}/5 Clientes usados
          </div>
        )}
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client, i) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-6 group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-pink/20">
                {client.name.charAt(0)}
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === client.id ? null : client.id);
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                
                <AnimatePresence>
                  {activeMenuId === client.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 glass-card border border-white/10 shadow-2xl z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => handleEditClient(client)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Edit2 size={16} className="text-brand-pink" />
                        Editar Cliente
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 size={16} />
                        Excluir Cliente
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <h3 className="text-lg md:text-xl font-bold mb-4 text-white truncate">{client.name}</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-xs md:text-sm text-text-secondary">
                <Mail size={16} className="text-brand-pink shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs md:text-sm text-text-secondary">
                <Phone size={16} className="text-brand-pink shrink-0" />
                <span className="truncate">{client.phone}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {budgets.filter(b => b.clientId === client.id).length} ORÇAMENTOS
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditClient(client)}
                  className="p-2 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteClient(client.id)}
                  className="p-2 hover:bg-red-400/10 rounded-lg text-text-secondary hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Client Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Nome completo</label>
                  <input
                    type="text"
                    required
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="Ex: Ana Silva"
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="ana@email.com"
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Telefone (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="input-field"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline flex-1">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingClient ? 'Salvar Alterações' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
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
