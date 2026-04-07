import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Info, CreditCard, QrCode, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { User, Budget } from "../lib/storage";
import { generatePixPayload } from "../lib/pix";

interface PixPaymentProps {
  user: User | null;
  budget: Budget;
}

export default function PixPayment({ user, budget }: PixPaymentProps) {
  const [pixCode, setPixCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  useEffect(() => {
    if (user?.pixData) {
      setIsGenerating(true);
      try {
        const payload = generatePixPayload(
          user.pixData.key,
          user.pixData.beneficiary,
          user.pixData.city,
          budget.total,
          user.pixData.keyType
        );
        setPixCode(payload);
      } catch (error) {
        console.error("Erro ao gerar Pix:", error);
        setPixCode("");
      } finally {
        setIsGenerating(false);
      }
    }
  }, [user?.pixData?.key, user?.pixData?.beneficiary, user?.pixData?.city, budget.total, budget.id]);

  useEffect(() => {
    if (!isGenerating && pixCode) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isGenerating, pixCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPixCode = () => {
    if (!pixCode || isGenerating) return;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user?.pixData) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-text-secondary">
          <Info size={24} />
        </div>
        <div>
          <h4 className="font-bold text-white">Pagamento via Pix Indisponível</h4>
          <p className="text-sm text-text-secondary">O profissional ainda não cadastrou uma chave Pix para recebimento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0F1C] p-8 rounded-3xl border border-white/5 shadow-2xl space-y-8 max-w-sm mx-auto overflow-hidden relative">
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-[#0A0F1C]/95 backdrop-blur-md flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-[#FFD700]/10 rounded-full" />
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="text-[#FFD700] animate-pulse" size={32} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-[#FFD700] font-black text-xl tracking-tighter uppercase animate-pulse">
                Gerando o QR Code...
              </p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                Criptografando Pagamento
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-[10px] font-bold uppercase tracking-widest mb-2">
          <Sparkles size={12} /> Pagamento Seguro
        </div>
        <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <CreditCard className="text-[#FFD700]" size={24} />
          Pagamento via Pix
        </h3>
        <div className="py-2">
          <p className="text-3xl font-black text-white">
            R$ {budget.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-text-secondary">Valor total do orçamento</p>
        </div>
      </div>

      <div className="flex justify-center relative">
        <div className="p-4 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.15)] relative">
          {pixCode && !isGenerating ? (
            <>
              <QRCodeSVG 
                value={pixCode} 
                size={220}
                level="Q"
                includeMargin={true}
                className="mx-auto"
              />
              {timeLeft === 0 && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 rounded-2xl">
                  <AlertCircle size={32} className="text-red-500 mb-2" />
                  <p className="text-xs font-bold text-gray-900">Código Expirado</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 text-[10px] text-brand-purple underline font-bold"
                  >
                    Gerar novo código
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-[220px] h-[220px] bg-gray-50 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
               <QrCode size={48} className="text-gray-200 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">
          <span>Código Pix Copia e Cola</span>
          <span className={cn("flex items-center gap-1", timeLeft < 300 ? "text-red-400" : "text-[#FFD700]")}>
            <AlertCircle size={10} /> Expira em: {formatTime(timeLeft)}
          </span>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-[#FFD700]/5 blur-xl group-hover:bg-[#FFD700]/10 transition-all rounded-xl" />
          <div className="relative bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1 truncate text-xs font-mono text-text-secondary select-all">
              {isGenerating ? "Gerando código seguro..." : (pixCode || "Erro ao gerar payload")}
            </div>
            <button 
              onClick={copyPixCode}
              disabled={isGenerating || !pixCode}
              className="p-3 bg-[#FFD700] text-background rounded-lg hover:scale-110 active:scale-95 transition-all shadow-lg shadow-[#FFD700]/20 disabled:opacity-50 disabled:hover:scale-100"
              title="Copiar código Pix"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {copied && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs font-bold text-[#FFD700] flex items-center justify-center gap-1"
            >
              <Check size={14} /> Código copiado com sucesso!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-6 border-t border-white/5 text-center space-y-1">
        <p className="text-[9px] text-text-secondary uppercase tracking-[0.2em]">
          Beneficiário Final
        </p>
        <p className="text-sm text-white font-black tracking-tight">
          {user.pixData.beneficiary}
        </p>
        <p className="text-[10px] text-text-secondary">
          {user.pixData.city}
        </p>
      </div>
    </div>
  );
}
