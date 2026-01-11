"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { cn } from "../../../lib/utils";

interface NeonSelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  tone?: "primary" | "secondary" | "accent";
}

export function NeonSelect({
  label,
  value,
  options,
  onChange,
  tone = "primary"
}: NeonSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toneStyles = {
    primary: "text-primary border-primary/30",
    secondary: "text-secondary border-secondary/30",
    accent: "text-accent border-accent/30",
  }[tone];

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full min-h-[84px] rounded-[24px] border bg-black/40 px-5 py-4 text-left transition-all",
          open ? "border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.08)]" : "border-white/10",
          toneStyles
        )}
      >
        <div className="text-[8px] font-black tracking-[0.3em] text-white/30 uppercase">{label}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-white/70">{selected?.label}</span>
          <ChevronLeft className={cn("w-3 h-3 text-white/30 transition-transform", open ? "rotate-90" : "-rotate-90")} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-black/90 p-2 shadow-2xl z-50"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase transition-all",
                  opt.value === value
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
