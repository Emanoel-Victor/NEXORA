import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { supabaseService } from "../services/supabaseService";
import { useAuth } from "../contexts/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (authError) throw authError;

      if (data.user) {
        // The profile is created by the Supabase trigger 'on_auth_user_created'
        // We wait a bit for the trigger to finish and then fetch the profile
        await new Promise(resolve => setTimeout(resolve, 1500));
        let profile = await supabaseService.getProfile(data.user.id);
        
        // Fallback: If trigger didn't create the profile, create it manually
        if (!profile) {
          try {
            profile = await supabaseService.createProfile({
              id: data.user.id,
              name: name,
              email: email,
            });
          } catch (createErr) {
            console.error("Error creating manual profile:", createErr);
            // If still fails, we'll redirect to login and let it handle fallback
            navigate("/login");
            return;
          }
        }

        if (profile) {
          await login(profile);
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      let message = err.message || "Erro ao criar conta. Tente novamente.";
      
      if (message.includes("rate limit exceeded")) {
        message = "Muitas tentativas de cadastro em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.";
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-display font-bold text-brand-gradient mb-4 inline-block">
            NEXORA
          </Link>
          <h1 className="text-2xl font-bold">Crie sua conta</h1>
          <p className="text-text-secondary">Comece a transformar orçamentos em clientes</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Nome completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-pink transition-colors" size={20} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="input-field pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-pink transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-field pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-pink transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-12"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Criar conta grátis
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-text-secondary">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-brand-pink font-semibold hover:underline">
            Faça login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
