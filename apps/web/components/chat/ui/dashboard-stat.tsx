"use client";

import React from "react";
import { cn } from "../../../lib/utils";

interface DashboardStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

export function DashboardStat({ icon, label, value, color }: DashboardStatProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg bg-white/5", color)}>{icon}</div>
      <div>
        <div className="text-[9px] font-black text-white/20 tracking-[0.2em]">{label}</div>
        <div className={cn("text-xs font-black tracking-tight", color)}>{value}</div>
      </div>
    </div>
  );
}
