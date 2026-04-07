import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Download, MessageCircle, Clock, Calendar, ShieldCheck, MapPin, ArrowLeft, Zap, Sparkles, FileText, Share2, CreditCard, QrCode, Copy } from "lucide-react";
import { formatCurrency, formatDate, cn } from "../lib/utils";
import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { storage, Budget, PLAN_LIMITS, User, Client } from "../lib/storage";
import { supabaseService } from "../services/supabaseService";
import { usePlan } from "../hooks/usePlan";
import UpgradeModal from "../components/UpgradeModal";
import PixPayment from "../components/PixPayment";

export default function BudgetView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plan, checkAccess, isUpgradeModalOpen, blockedFeature, closeUpgradeModal } = usePlan();
  const [isDownloading, setIsDownloading] = useState(false);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("PDF Gerado com Sucesso!");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<User | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (id) {
        setLoading(true);
        try {
          const data = await storage.getBudgetById(id);
          setBudget(data);
          if (data) {
            const [fetchedClients, profProfile] = await Promise.all([
              storage.getClients(data.userId),
              supabaseService.getProfile(data.userId)
            ]);
            
            setProfessionalProfile(profProfile);
            const foundClient = fetchedClients.find(c => c.id === data.clientId);
            setClient(foundClient || null);
          }
        } catch (error) {
          console.error("Error fetching budget:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-text-secondary">Carregando orçamento...</p>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Orçamento não encontrado</h1>
        <button onClick={() => navigate("/")} className="btn-primary">Voltar para o início</button>
      </div>
    );
  }

  const currentUser = storage.getUser();
  const isOwner = currentUser?.id === budget.userId;
  const budgetPlan = professionalProfile?.plan || 'free';
  const pixDataToUse = budget.pixData || professionalProfile?.pixData || (isOwner ? currentUser?.pixData : undefined);

  const professional = {
    name: pixDataToUse?.beneficiary || currentUser?.name || budget.professionalName || "João Designer",
    email: currentUser?.email || "joao@design.com",
    phone: currentUser?.phone || budget.professionalPhone || "5511999999999",
    logo: currentUser?.logo || budget.professionalLogo || "https://picsum.photos/seed/logo/100/100"
  };

  const handleApprove = async () => {
    // Check access based on professional's plan if viewer is not owner
    const hasAccess = isOwner ? await checkAccess('whatsapp') : PLAN_LIMITS[budgetPlan].features.whatsapp;
    if (!hasAccess) {
      if (isOwner) return; // checkAccess already showed modal
      // For non-owners, we just don't do anything or maybe show a message
      return;
    }
    
    // Clean phone numbers (remove non-digits)
    const cleanPhone = (phone: string) => {
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 11 && !cleaned.startsWith('55')) {
        cleaned = '55' + cleaned;
      }
      return cleaned;
    };

    if (isOwner && client?.phone) {
      const clientPhone = cleanPhone(client.phone);
      const message = encodeURIComponent(`Olá ${budget.clientName}, segue o link do seu orçamento #${budget.id} no valor de ${formatCurrency(budget.total)} para sua aprovação: ${window.location.href}`);
      window.open(`https://wa.me/${clientPhone}?text=${message}`, "_blank");
    } else {
      const profPhone = cleanPhone(professional.phone);
      const message = encodeURIComponent(`Olá, quero aprovar o orçamento #${budget.id} que você me enviou no valor de ${formatCurrency(budget.total)}.`);
      window.open(`https://wa.me/${profPhone}?text=${message}`, "_blank");
    }
  };

  const handlePayment = () => {
    if (!pixDataToUse) return;
    setShowPaymentModal(true);
  };

  const downloadPDF = async () => {
    // PDF export is technically allowed on all plans, but style varies.
    // We only show upgrade modal for the owner if they are on free.
    if (isOwner && budgetPlan === 'free') {
      // They can still download, but we might want to nudge them to Pro for professional PDF
      // For now, let's just allow it as it's a basic feature.
    }
    
    if (!pdfRef.current) return;
    setIsDownloading(true);
    
    try {
      // Ensure we are at the top for proper capture
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);

      // Small delay to ensure any animations are finished and scroll is stable
      await new Promise(resolve => setTimeout(resolve, 300));

      // All plans are now dark theme
      const bgColor = "#0A0F1C";
      const surfaceColor = "#161B27"; // bg-white/5 equivalent over #0A0F1C
      const cardColor = "#111827";    // bg-card equivalent

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: bgColor,
        width: pdfRef.current.scrollWidth,
        height: pdfRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Force background on the whole document to avoid white gaps
          clonedDoc.documentElement.style.backgroundColor = bgColor;
          clonedDoc.body.style.backgroundColor = bgColor;

          // 1. Remove all style tags that might contain oklch/oklab/color-mix (Tailwind 4 defaults)
          const styleTags = Array.from(clonedDoc.getElementsByTagName('style'));
          styleTags.forEach(tag => {
            try {
              let css = tag.innerHTML;
              if (css.includes('oklch') || css.includes('oklab') || css.includes('color-mix')) {
                tag.innerHTML = css
                  .replace(/oklch\(0\.627 0\.258 338\.29\)/g, '#FF4FD8') // brand-pink
                  .replace(/oklch\(0\.715 0\.203 45\.36\)/g, '#FF8A4C')  // brand-orange
                  .replace(/oklch\(0\.845 0\.184 86\.18\)/g, '#FFD700')  // brand-gold
                  .replace(/oklch\([^)]+\)/g, '#94a3b8') // fallback to slate-400
                  .replace(/oklab\([^)]+\)/g, '#94a3b8')
                  .replace(/color-mix\([^)]+\)/g, '#94a3b8');
              }
            } catch (e) {
              console.warn("Could not clean style tag", e);
            }
          });

          // 2. Clean inline styles and handle gradients/transparencies
          const elements = Array.from(clonedDoc.getElementsByTagName('*'));
          elements.forEach(el => {
            const htmlEl = el as HTMLElement;
            
            // Fix gradients and text-clip which html2canvas fails on
            if (htmlEl.classList.contains('text-brand-gradient') || htmlEl.classList.contains('bg-brand-gradient')) {
              htmlEl.style.background = 'none';
              htmlEl.style.webkitBackgroundClip = 'unset';
              htmlEl.style.webkitTextFillColor = 'inherit';
              htmlEl.style.color = budgetPlan === 'premium' ? '#FFD700' : '#FF4FD8';
            }

            // Replace glass-card and bg-white/5 with solid colors for PDF
            if (htmlEl.classList.contains('glass-card')) {
              htmlEl.style.backgroundColor = cardColor;
              htmlEl.style.backgroundImage = 'none';
              htmlEl.style.backdropFilter = 'none';
              htmlEl.style.setProperty('-webkit-backdrop-filter', 'none');
              htmlEl.style.border = '1px solid #1f2937';
            }
            if (htmlEl.classList.contains('bg-white/5')) {
              htmlEl.style.backgroundColor = surfaceColor;
            }
            if (htmlEl.classList.contains('bg-card')) {
              htmlEl.style.backgroundColor = cardColor;
            }
            if (htmlEl.classList.contains('bg-brand-pink/5')) {
              htmlEl.style.backgroundColor = '#1A0D16'; // Dark pinkish surface
            }
            if (htmlEl.classList.contains('bg-brand-pink/10')) {
              htmlEl.style.backgroundColor = '#2D1424';
            }
            if (htmlEl.classList.contains('bg-brand-gold/5')) {
              htmlEl.style.backgroundColor = '#1A160D'; // Dark goldish surface
            }
            if (htmlEl.classList.contains('bg-brand-gold/10')) {
              htmlEl.style.backgroundColor = '#2D2714';
            }
            if (htmlEl.classList.contains('bg-green-400/10')) {
              htmlEl.style.backgroundColor = '#0D1A11';
            }
            if (htmlEl.classList.contains('bg-brand-orange/10')) {
              htmlEl.style.backgroundColor = '#1A130D';
            }

            // Remove modern colors from inline styles
            const styleAttr = htmlEl.getAttribute('style');
            if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix'))) {
              htmlEl.setAttribute('style', styleAttr
                .replace(/oklch\([^)]+\)/g, '#94a3b8')
                .replace(/oklab\([^)]+\)/g, '#94a3b8')
                .replace(/color-mix\([^)]+\)/g, '#94a3b8')
              );
            }
            
            // Force opacity to 1 to avoid animation issues
            if (htmlEl.style.opacity === '0') htmlEl.style.opacity = '1';
          });

          // 3. Remove rounded corners and shadow for the PDF capture to fill the sheet perfectly
          const container = clonedDoc.getElementById('budget-pdf-content');
          if (container) {
            container.style.borderRadius = '0';
            container.style.boxShadow = 'none';
            container.style.border = 'none';
            container.style.margin = '0';
            container.style.width = '100%';
            container.style.maxWidth = 'none';
            container.style.backgroundColor = bgColor;
          }
        }
      });

      // Restore scroll position
      window.scrollTo(0, originalScrollY);

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas generation failed or returned empty.");
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Function to fill background color on the PDF page
      // Using RGB values to ensure compatibility with all jsPDF versions
      const fillBackground = () => {
        pdf.setFillColor(10, 15, 28); // #0A0F1C
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      };

      // Add first page
      fillBackground();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        fillBackground();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      setSuccessMessage("PDF Gerado com Sucesso!");
      pdf.save(`orcamento-${budget.id}.pdf`);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Erro detalhado ao gerar PDF:", error);
      alert("Ocorreu um erro técnico ao gerar o PDF. Tente novamente ou use a função de imprimir do seu navegador (Ctrl+P).");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    try {
      const shareUrl = `${window.location.origin}/view/${budget.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setSuccessMessage("Link Copiado com Sucesso!");
      setShowSuccess(true);
      setTimeout(() => {
        setCopied(false);
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const shareViaWhatsApp = () => {
    const shareUrl = `${window.location.origin}/view/${budget.id}`;
    const text = encodeURIComponent(`Confira o orçamento #${budget.id} de ${professional.name}: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaEmail = () => {
    const shareUrl = `${window.location.origin}/view/${budget.id}`;
    const subject = encodeURIComponent(`Orçamento #${budget.id} - ${professional.name}`);
    const body = encodeURIComponent(`Olá, confira o orçamento no link abaixo:\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const layoutStyle = PLAN_LIMITS[budgetPlan].features.budget_link;

  return (
    <div className="min-h-screen p-4 md:p-8 selection:bg-brand-pink/30 bg-background text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-lg text-text-secondary transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className={cn(
              "text-2xl font-bold",
              budgetPlan === 'free' ? "text-white" : "text-brand-gradient"
            )}>
              NEXORA
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl transition-all text-text-secondary bg-white/5 hover:text-white shrink-0"
              title="Compartilhar Link"
            >
              {copied ? <CheckCircle2 size={20} className="text-green-400" /> : <Share2 size={20} />}
            </button>
            <button
              onClick={downloadPDF}
              disabled={isDownloading}
              className={cn(
                "py-2.5 px-4 text-xs md:text-sm rounded-xl font-bold flex items-center gap-2 transition-all shrink-0",
                budgetPlan === 'free' ? "bg-white/5 text-white border border-border hover:bg-white/10" : "btn-outline"
              )}
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download size={16} /> 
                  <span className="hidden xs:inline">Baixar PDF</span>
                  <span className="xs:hidden">PDF</span>
                  {budgetPlan === 'free' ? '(Simples)' : budgetPlan === 'pro' ? '(Pro)' : '(Premium)'}
                </>
              )}
            </button>
            <button 
              onClick={handleApprove} 
              className={cn(
                "py-2.5 px-4 text-xs md:text-sm rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 text-white",
                budgetPlan === 'free' ? "bg-white/5 border border-border" : "btn-primary"
              )}
            >
              <MessageCircle size={16} /> <span className="hidden xs:inline">{budgetPlan === 'free' ? 'Aprovar (Pro)' : isOwner ? 'Enviar para Cliente' : 'Aprovar'}</span>
              <span className="xs:hidden">{budgetPlan === 'free' ? 'Pro' : isOwner ? 'Enviar para Cliente' : 'Aprovar'}</span>
            </button>
          </div>
        </div>

        {/* Budget Content */}
        <motion.div
          ref={pdfRef}
          id="budget-pdf-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 md:p-12 space-y-12 shadow-2xl",
            budgetPlan === 'free' ? "bg-card border border-border rounded-2xl" : "glass-card rounded-3xl shadow-brand-pink/10",
            layoutStyle === 'premium' ? "border-brand-gold/30 shadow-brand-gold/5" : ""
          )}
        >
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between gap-8 border-b pb-12 border-border">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img src={professional.logo} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 rounded-2xl border border-border" referrerPolicy="no-referrer" />
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">{professional.name}</h1>
                  <p className="text-sm text-text-secondary">{professional.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs md:text-sm text-text-secondary">
                  <Calendar size={14} className="text-brand-pink" />
                  Emitido em: {formatDate(budget.date)}
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-text-secondary">
                  <Clock size={14} className="text-brand-orange" />
                  Válido até: {formatDate(budget.expiry)}
                </div>
              </div>
            </div>
            <div className="md:text-right space-y-2">
              <span className={cn(
                "px-4 py-1 rounded-full text-[10px] md:text-xs font-bold border inline-block",
                budgetPlan === 'free' ? "bg-white/5 text-white border border-white/10" : "bg-brand-pink/10 text-brand-pink border-brand-pink/20",
                layoutStyle === 'premium' ? "bg-brand-gold/10 text-brand-gold border-brand-gold/20" : ""
              )}>
                ORÇAMENTO #{budget.id}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold mt-4 text-white">Para: {budget.clientName}</h2>
              <p className="text-sm text-text-secondary">Proposta de Prestação de Serviços</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <CheckCircle2 size={24} className="text-brand-pink" />
              Serviços e Valores
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-white/5">
                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary">Descrição</th>
                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary text-center">Qtd</th>
                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary text-right">Valor Unit.</th>
                    <th className="px-6 py-4 text-sm font-semibold text-text-secondary text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {budget.items.map((item, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-6 font-medium text-white">{item.name}</td>
                      <td className="px-6 py-6 text-center text-text-secondary">{item.quantity}</td>
                      <td className="px-6 py-6 text-right text-text-secondary">{formatCurrency(item.price)}</td>
                      <td className="px-6 py-6 text-right font-bold text-white">{formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-brand-pink/5">
                    <td colSpan={3} className="px-6 py-8 text-right font-bold text-xl text-white">Total do Investimento:</td>
                    <td className={cn(
                      "px-6 py-8 text-right font-bold text-3xl", 
                      budgetPlan === 'free' ? "text-white" : "text-brand-gradient"
                    )}>{formatCurrency(budget.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Section (Available if professional is Premium and has Pix configured) */}
          {professionalProfile?.plan === 'premium' && pixDataToUse && (
            <div className="bg-brand-gold/5 border border-brand-gold/20 p-8 rounded-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Pagamento Facilitado</h3>
                    <p className="text-xs text-text-secondary">Pague via Pix de forma rápida e segura</p>
                  </div>
                </div>
                <button onClick={handlePayment} className="btn-primary bg-brand-gold hover:bg-brand-gold/80 text-black border-none shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                  Pagar Agora
                </button>
              </div>
            </div>
          )}

          {/* Observations */}
          <div className="grid md:grid-cols-2 gap-12 pt-12 border-t border-border">
            <div className="space-y-4">
              <h3 className="font-bold text-text-secondary uppercase text-xs tracking-widest">Observações e Condições</h3>
              <p className="text-sm leading-relaxed p-6 rounded-2xl border bg-white/5 text-text-secondary border-border">
                {budget.observations}
              </p>
            </div>
            <div className="space-y-6">
              <h3 className="font-bold text-text-secondary uppercase text-xs tracking-widest">Garantias Nexora</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center text-green-400 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Segurança Jurídica</h4>
                    <p className="text-xs text-text-secondary">Este orçamento serve como proposta formal de serviço.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Validade Digital</h4>
                    <p className="text-xs text-text-secondary">Aprovação via WhatsApp é válida como aceite comercial.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-12 border-t border-border">
            <p className="text-sm text-text-secondary">
              Gerado via <span className={cn(
                "font-bold", 
                budgetPlan === 'free' ? "text-white" : "text-brand-pink"
              )}>NEXORA</span> - Transforme orçamentos em clientes.
            </p>
          </div>
        </motion.div>

        {/* Floating Action Button Mobile */}
        <div className="md:hidden fixed bottom-8 left-4 right-4 z-50">
          <button
            onClick={handleApprove}
            className={cn(
              "w-full py-4 shadow-2xl flex items-center justify-center gap-3 text-lg rounded-2xl font-bold transition-all text-white",
              budgetPlan === 'free' ? "bg-white/10 border border-white/20 backdrop-blur-xl" : "btn-primary shadow-brand-pink/40"
            )}
          >
            <MessageCircle size={24} />
            {budgetPlan === 'free' ? 'Aprovar (Pro)' : isOwner ? 'Enviar para Cliente' : 'Aprovar Orçamento Agora'}
          </button>
        </div>
      </div>

      {/* Payment Modal (Premium Only) */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md"
            >
              <PixPayment 
                user={{ pixData: pixDataToUse } as User} 
                budget={budget} 
              />
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-4 text-text-secondary hover:text-white transition-colors font-bold"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-green-500 text-white rounded-full font-bold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={20} /> {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-8",
                budgetPlan === 'free' ? "bg-card text-white border border-border" : "glass-card text-white",
                budgetPlan === 'premium' ? "border-brand-gold/30" : "border-white/10"
              )}
            >
              <div className="text-center space-y-2">
                <div className={cn(
                  "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center",
                  budgetPlan === 'free' ? "bg-white/5 text-white" : 
                  budgetPlan === 'premium' ? "bg-brand-gold/20 text-brand-gold" : "bg-brand-pink/20 text-brand-pink"
                )}>
                  <Share2 size={32} />
                </div>
                <h3 className="text-2xl font-bold">Compartilhar Orçamento</h3>
                <p className="text-text-secondary text-sm">Escolha como deseja enviar este orçamento</p>
                <div className={cn(
                  "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2",
                  budgetPlan === 'free' ? "bg-white/5 text-white border border-white/10" : 
                  budgetPlan === 'premium' ? "bg-brand-gold/20 text-brand-gold" : "bg-brand-pink/20 text-brand-pink"
                )}>
                  Link {budgetPlan === 'free' ? 'Simples' : budgetPlan === 'pro' ? 'Profissional' : 'Premium com Pix'}
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border text-center break-all text-xs font-mono",
                budgetPlan === 'free' ? "bg-white/5 border-border text-text-secondary" : "bg-white/5 border-white/10 text-text-secondary"
              )}>
                {`${window.location.origin}/view/${budget.id}`}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={shareViaWhatsApp}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]",
                    budgetPlan === 'free' ? "bg-white/5 hover:bg-white/10 border border-border" : "bg-white/5 hover:bg-white/10 border border-white/10"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
                    <MessageCircle size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">WhatsApp</div>
                    <div className="text-xs text-text-secondary">Enviar link direto para o cliente</div>
                  </div>
                </button>

                <button
                  onClick={shareViaEmail}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]",
                    budgetPlan === 'free' ? "bg-white/5 hover:bg-white/10 border border-border" : "bg-white/5 hover:bg-white/10 border border-white/10"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <FileText size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">E-mail</div>
                    <div className="text-xs text-text-secondary">Enviar proposta formal por e-mail</div>
                  </div>
                </button>

                <button
                  onClick={copyToClipboard}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]",
                    budgetPlan === 'free' ? "bg-white/5 hover:bg-white/10 border border-border" : "bg-white/5 hover:bg-white/10 border border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    budgetPlan === 'free' ? "bg-white/10 text-white" : 
                    budgetPlan === 'premium' ? "bg-brand-gold/20 text-brand-gold" : "bg-brand-pink/20 text-brand-pink"
                  )}>
                    {copied ? <CheckCircle2 size={24} className="text-green-400" /> : <Copy size={24} />}
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Copiar Link</div>
                    <div className="text-xs text-text-secondary">Copiar URL para a área de transferência</div>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setShowShareModal(false)}
                className="w-full py-4 font-bold transition-colors text-text-secondary hover:text-white"
              >
                Cancelar
              </button>
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
