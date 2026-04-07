import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, PlusCircle, LogOut, Menu, X, Settings, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Orçamentos", path: "/budgets" },
    { icon: Users, label: "Clientes", path: "/clients" },
    { icon: PlusCircle, label: "Novo Orçamento", path: "/create" },
    { icon: Settings, label: "Configurações", path: "/settings" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };


  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-card m-4 mr-0 border-r-0 rounded-r-none overflow-y-auto scrollbar-hide">
        <div className="p-6 sticky top-0 bg-background/50 backdrop-blur-md z-10">
          <Link to="/dashboard" className="text-2xl font-display font-bold text-brand-gradient">
            NEXORA
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                location.pathname === item.path
                  ? "bg-brand-gradient text-white shadow-lg shadow-brand-pink/20"
                  : "hover:bg-white/5 text-text-secondary hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-card m-2 rounded-xl flex items-center justify-between p-3 bg-background/80 backdrop-blur-xl border-white/10">
        <Link to="/dashboard" className="text-lg font-display font-bold text-brand-gradient">
          NEXORA
        </Link>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg text-white">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 glass-card z-[70] md:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <span className="text-2xl font-display font-bold text-brand-gradient">
                  NEXORA
                </span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      location.pathname === item.path
                        ? "bg-brand-gradient text-white shadow-lg shadow-brand-pink/20"
                        : "hover:bg-white/5 text-text-secondary hover:text-white"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>


      {/* Main Content */}
      <main className="flex-1 p-2 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
