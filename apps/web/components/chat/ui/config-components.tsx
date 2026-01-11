"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

export function ConfigGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="text-[10px] font-black text-white/20 tracking-[0.3em] flex items-center gap-4">{label} <div className="h-px flex-1 bg-white/5" /></div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function ConfigSlider({ label, value, min, max, step, onChange, color }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, color: 'primary' | 'secondary' | 'accent' }) {
  const accentColor = { primary: "accent-primary", secondary: "accent-secondary", accent: "accent-accent" }[color];
  const textColor = { primary: "text-primary", secondary: "text-secondary", accent: "text-accent" }[color];
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center"><span className="text-xs font-bold text-white/50">{label}</span><span className={cn("font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/5", textColor)}>{value}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className={cn("w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer", accentColor)} />
    </div>
  );
}
