"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ShieldAlert, Terminal, Check, Info } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ImpressiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  type?: "danger" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
}

export function ImpressiveModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = "info",
  confirmText = "CONFIRM_SEQUENCE",
  cancelText = "ABORT_COMMAND"
}: ImpressiveModalProps) {
  
  const themes = {
    danger: {
      icon: <ShieldAlert className="w-8 h-8 text-accent" />,
      glow: "shadow-accent/20",
      border: "border-accent/30",
      button: "bg-accent text-white shadow-accent/40",
      accent: "text-accent"
    },
    info: {
      icon: <Terminal className="w-8 h-8 text-primary" />,
      glow: "shadow-primary/20",
      border: "border-primary/30",
      button: "bg-primary text-black shadow-primary/40",
      accent: "text-primary"
    },
    success: {
      icon: <Check className="w-8 h-8 text-secondary" />,
      glow: "shadow-secondary/20",
      border: "border-secondary/30",
      button: "bg-secondary text-white shadow-secondary/40",
      accent: "text-secondary"
    }
  };

  const activeTheme = themes[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "w-full max-w-lg glass-panel p-8 rounded-[32px] border pointer-events-auto relative overflow-hidden shadow-2xl",
                activeTheme.border,
                activeTheme.glow
              )}
            >
              {/* Scanline overlay for modal */}
              <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
                <div className="scanline animate-scanline" />
              </div>

              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                {/* Icon with animated ring */}
                <div className="relative mb-8">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className={cn("absolute -inset-4 rounded-full blur-xl opacity-20", 
                      type === "danger" ? "bg-accent" : type === "success" ? "bg-secondary" : "bg-primary"
                    )}
                  />
                  <div className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center border-2 bg-black/40 relative z-10",
                    activeTheme.border
                  )}>
                    {activeTheme.icon}
                  </div>
                </div>

                <h2 className="text-3xl font-black tracking-tighter mb-3 uppercase italic italic-none">
                  {title}
                </h2>
                
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                <p className="text-white/50 text-sm font-bold tracking-wide leading-relaxed mb-10 max-w-[320px]">
                  {description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 glass-panel rounded-2xl font-black text-[10px] tracking-[0.2em] text-white/30 hover:text-white hover:bg-white/5 transition-all uppercase"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm?.();
                      onClose();
                    }}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-lg uppercase",
                      activeTheme.button
                    )}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
