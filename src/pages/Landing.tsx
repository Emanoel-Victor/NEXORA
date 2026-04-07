import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Zap, Shield, Smartphone, CheckCircle2, X, Users, BarChart3, PieChart as PieChartIcon, Plus, Clock, MessageCircle, TrendingUp, MousePointer2, Sparkles } from "lucide-react";
import { PLAN_LIMITS } from "../lib/storage";

export default function Landing() {
  const plans = [
    { id: 'free', ...PLAN_LIMITS.free, color: 'brand-pink' },
    { id: 'pro', ...PLAN_LIMITS.pro, color: 'brand-pink' },
    { id: 'premium', ...PLAN_LIMITS.premium, color: 'brand-gold' }
  ];

  return (
    <div className="min-h-screen bg-background text-white selection:bg-brand-pink/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card m-4 rounded-2xl flex items-center justify-between px-8 py-4">
        <div className="text-2xl font-display font-bold text-brand-gradient">
          NEXORA
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
          <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
          <Link to="/login" className="hover:text-white transition-colors">Entrar</Link>
        </nav>
        <Link to="/signup" className="btn-primary py-2 px-6 text-sm">
          Começar Grátis
        </Link>
      </header>

      {/* Hero Section */}
      <section className="pt-48 pb-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-2 rounded-full bg-brand-pink/10 text-brand-pink text-sm font-semibold border border-brand-pink/20 mb-6 inline-block">
              Transforme orçamentos em clientes
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-tight">
              Crie orçamentos <span className="text-brand-gradient">profissionais</span> em segundos.
            </h1>
            <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
              A Nexora ajuda profissionais autônomos e pequenas empresas a fecharem mais negócios com orçamentos inteligentes e compartilháveis.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="btn-primary text-lg w-full md:w-auto">
                Criar meu primeiro orçamento <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn-outline text-lg w-full md:w-auto">
                Ver demonstração
              </Link>
            </div>
          </motion.div>

          {/* Hero Image / Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-24 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="glass-card p-2 md:p-4 rounded-3xl overflow-hidden shadow-2xl shadow-brand-purple/20 bg-[#050810] relative group">
              {/* Floating Advantage Badges */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -top-6 -left-6 z-20 glass-card p-4 shadow-xl border-brand-pink/30 hidden lg:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink">
                    <TrendingUp size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-text-secondary uppercase font-black tracking-tighter">Conversão</p>
                    <p className="text-sm font-bold text-white">+45% de Fechamento</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute -bottom-6 -right-6 z-20 glass-card p-4 shadow-xl border-brand-gold/30 hidden lg:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                    <Sparkles size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-text-secondary uppercase font-black tracking-tighter">Agilidade</p>
                    <p className="text-sm font-bold text-white">Orçamentos em 30s</p>
                  </div>
                </div>
              </motion.div>

              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&h=800&q=80"
                alt="Dashboard Nexora Real"
                className="rounded-2xl w-full opacity-90"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Tudo o que você precisa</h2>
            <p className="text-text-secondary">Ferramentas pensadas para acelerar suas vendas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Rápido e Simples", desc: "Crie orçamentos completos em menos de 1 minuto." },
              { icon: Smartphone, title: "Foco em Mobile", desc: "Seus clientes visualizam orçamentos perfeitos no celular." },
              { icon: Shield, title: "Profissionalismo", desc: "Páginas exclusivas que geram confiança e autoridade." },
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 group">
                <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex items-center justify-center text-brand-pink mb-6 group-hover:scale-110 transition-transform glow-pink">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Planos simples para você crescer</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`glass-card p-8 flex flex-col transition-all relative ${
                  plan.id === 'pro' ? 'border-brand-pink/30 scale-105 shadow-2xl shadow-brand-pink/10' : 'border-white/5'
                }`}
              >
                {plan.id === 'pro' && (
                  <div className="absolute top-0 right-0 bg-brand-pink text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-tighter">POPULAR</div>
                )}
                <div className="mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.id === 'premium' ? 'text-brand-gold' : plan.id === 'pro' ? 'text-brand-pink' : 'text-white'}`}>
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-bold mb-4">
                    {plan.price}<span className="text-lg text-text-secondary font-normal">/mês</span>
                  </div>
                  <p className="text-text-secondary text-sm">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.featureList.map((feature, i) => (
                    <li key={i} className={`flex items-start gap-3 text-sm ${feature.included ? 'text-gray-300' : 'text-gray-400 opacity-50'}`}>
                      {feature.included ? (
                        <CheckCircle2 size={18} className={`${plan.id === 'premium' ? 'text-brand-gold' : 'text-brand-pink'} shrink-0 mt-0.5`} />
                      ) : (
                        <X size={18} className="shrink-0 mt-0.5" />
                      )}
                      {feature.text}
                    </li>
                  ))}
                </ul>
                <Link 
                  to="/signup" 
                  className={`w-full text-sm text-center py-3 rounded-xl font-bold transition-all ${
                    plan.id === 'pro' 
                      ? 'btn-primary' 
                      : plan.id === 'premium'
                        ? 'border border-brand-gold/50 hover:bg-brand-gold/10 text-brand-gold'
                        : 'btn-outline'
                  }`}
                >
                  {plan.id === 'free' ? 'Começar agora' : `Assinar ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-2xl font-display font-bold text-brand-gradient">
            NEXORA
          </div>
          <div className="text-text-secondary text-sm">
            © 2026 Nexora. Todos os direitos reservados.
          </div>
          <div className="flex gap-6 text-text-secondary text-sm">
            <a href="#" className="hover:text-white">Termos</a>
            <a href="#" className="hover:text-white">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

