"use client";

import React, { useMemo } from "react";
import { BrainCircuit, Filter, Tag, Clock } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/nexus-ui";

interface MemorySidebarContentProps {
  memories: any[];
  onSelectFilter: (filter: string | null) => void;
  selectedFilter: string | null;
}

export function MemorySidebarContent({ memories, onSelectFilter, selectedFilter }: MemorySidebarContentProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    let today = 0;
    let thisWeek = 0;
    
    memories.forEach(m => {
        const d = new Date(m.updatedAt).getTime();
        const diff = now.getTime() - d;
        if (diff < oneDay) today++;
        if (diff < oneWeek) thisWeek++;
    });

    return { today, thisWeek, total: memories.length };
  }, [memories]);

  return (
    <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 pb-4 border-b border-white/10">
        <BrainCircuit className="w-5 h-5 text-primary" />
        <span className="text-sm font-bold tracking-widest text-white">MEMORY_MATRIX</span>
      </div>

      <StaggerContainer className="space-y-6">
        <StaggerItem className="space-y-2">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Quick Filters
            </h3>
            <div className="space-y-1">
                <button
                    onClick={() => onSelectFilter(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${!selectedFilter ? "bg-primary/20 text-primary border border-primary/30" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                    All Memories <span className="float-right opacity-50">{stats.total}</span>
                </button>
                <button
                    onClick={() => onSelectFilter("recent")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === "recent" ? "bg-primary/20 text-primary border border-primary/30" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                    Recently Updated <span className="float-right opacity-50">{stats.thisWeek}</span>
                </button>
            </div>
        </StaggerItem>

        <StaggerItem className="glass-panel p-4 rounded-xl border-white/5 bg-white/5">
             <div className="flex items-center gap-3 mb-2">
                 <Clock className="w-4 h-4 text-secondary" />
                 <span className="text-xs font-bold text-white/70 uppercase">Insight Pulse</span>
             </div>
             <div className="text-[10px] text-white/40 leading-relaxed">
                 {stats.today} signals encoded in the last 24 cycles.
                 <br/>
                 Memory density is optimal.
             </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
