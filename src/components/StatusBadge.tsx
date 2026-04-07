import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Clock, XCircle, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { storage, Budget } from "../lib/storage";

interface StatusBadgeProps {
  budget: Budget;
  onStatusChange?: (newStatus: Budget['status']) => void;
  className?: string;
}

export default function StatusBadge({ budget, onStatusChange, className }: StatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const statuses: { label: Budget['status']; color: string; icon: any }[] = [
    { label: "Pendente", color: "text-brand-gold bg-brand-gold/10", icon: Clock },
    { label: "Aprovado", color: "text-green-400 bg-green-400/10", icon: Check },
    { label: "Recusado", color: "text-red-400 bg-red-400/10", icon: XCircle },
  ];

  const currentStatus = statuses.find(s => s.label === budget.status) || statuses[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusUpdate = (newStatus: Budget['status']) => {
    const updatedBudget = { ...budget, status: newStatus };
    storage.saveBudget(updatedBudget);
    if (onStatusChange) onStatusChange(newStatus);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95",
          currentStatus.color
        )}
      >
        {budget.status}
        <ChevronDown size={12} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 top-full mt-2 right-0 md:left-0 w-32 bg-[#0A0F1C] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {statuses.map((status) => (
              <button
                key={status.label}
                onClick={() => handleStatusUpdate(status.label)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-white/5",
                  status.label === budget.status ? status.color : "text-text-secondary"
                )}
              >
                <status.icon size={14} />
                {status.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
