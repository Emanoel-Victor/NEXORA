import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { supabaseService } from "../services/supabaseService";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Fetch profile from Supabase
        let profile = await supabaseService.getProfile(data.user.id);
        
        // Fallback: If profile doesn't exist, create it from user metadata
        if (!profile) {
          try {
            profile = await supabaseService.createProfile({
              id: data.user.id,
              name: data.user.user_metadata?.name || "Usuário",
              email: data.user.email || "",
            });
          } catch (createErr) {
            console.error("Error creating fallback profile:", createErr);
            throw new Error("Perfil não encontrado e não pôde ser criado.");
          }
        }

        if (profile) {
          await login(profile);
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let message = err.message || "Erro ao entrar na conta. Verifique suas credenciais.";
      
      if (message.includes("rate limit exceeded")) {
        message = "Muitas tentativas de login em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.";
      } else if (message.includes("Invalid login credentials")) {
        message = "E-mail ou senha incorretos. Verifique seus dados e tente novamente.";
      } else if (message.includes("Email not confirmed")) {
        message = "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e a pasta de spam) para ativar sua conta.";
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
          <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
          <p className="text-text-secondary">Entre na sua conta para continuar</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
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
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium">Senha</label>
                <button type="button" className="text-xs text-brand-pink hover:underline">Esqueceu a senha?</button>
              </div>
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
                  Entrar na conta
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-text-secondary">
          Não tem uma conta?{" "}
          <Link to="/signup" className="text-brand-pink font-semibold hover:underline">
            Crie agora
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
