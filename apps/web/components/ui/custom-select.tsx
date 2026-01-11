"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function CustomSelect({ label, value, options, onChange, className, placeholder = "Select option..." }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

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
    <div className={cn("space-y-2 relative", className)} ref={containerRef}>
      {label && <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white transition-all hover:bg-white/10 outline-none",
          isOpen ? "border-primary/50 ring-1 ring-primary/20" : "focus:border-primary/30"
        )}
      >
        <span className={cn(!selectedOption && "text-white/20")}>
          {selectedOption ? selectedOption.label.toUpperCase() : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 z-[100] glass-panel rounded-2xl border-white/10 shadow-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all uppercase",
                  value === opt.value 
                    ? "bg-primary/10 text-primary" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                {opt.label}
                {value === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
