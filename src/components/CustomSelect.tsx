import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface Option {
  id: string;
  name: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Selecione...", 
  className 
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-left transition-all hover:border-brand-pink/30 focus:outline-none focus:border-brand-pink/50",
          isOpen && "border-brand-pink/50 ring-1 ring-brand-pink/20"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-gray-600")}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={cn("text-text-secondary transition-transform duration-300", isOpen && "rotate-180 text-brand-pink")} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="max-h-60 overflow-y-auto p-1">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-text-secondary italic">
                  Nenhum item encontrado
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm rounded-lg transition-all flex items-center justify-between group",
                      value === option.id 
                        ? "bg-brand-pink/10 text-brand-pink font-bold" 
                        : "text-text-secondary hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="truncate">{option.name}</span>
                    {value === option.id && <Check size={16} className="shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
