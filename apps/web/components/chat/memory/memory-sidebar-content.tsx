"use client";

import React, { useMemo } from "react";
import { BrainCircuit, Filter, Tag, Clock, Hash } from "lucide-react";
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
    const tagCounts: Record<string, number> = {};
    
    memories.forEach(m => {
        const d = new Date(m.updatedAt).getTime();
        const diff = now.getTime() - d;
        if (diff < oneDay) today++;
        if (diff < oneWeek) thisWeek++;

        // Infer tags from label words for now (assuming label is short)
        // or usage of explicit tags if available.
        const words = (m.label || "").split(" ").filter((w: string) => w.length > 3);
        words.forEach((w: string) => {
            const key = w.toUpperCase();
            tagCounts[key] = (tagCounts[key] || 0) + 1;
        });
    });

    const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag]) => tag);

    return { today, thisWeek, total: memories.length, topTags };
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-between group ${!selectedFilter ? "bg-primary/20 text-primary border border-primary/30" : "text-white/60 hover:text-white hover:bg-white/5 hover:translate-x-1"}`}
                >
                    <span>All Memories</span>
                    <span className={`text-[10px] ${!selectedFilter ? "text-primary/70" : "text-white/20 group-hover:text-white/50"}`}>{stats.total}</span>
                </button>
                <button
                    onClick={() => onSelectFilter("recent")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-between group ${selectedFilter === "recent" ? "bg-primary/20 text-primary border border-primary/30" : "text-white/60 hover:text-white hover:bg-white/5 hover:translate-x-1"}`}
                >
                    <span>Recently Updated</span>
                    <span className={`text-[10px] ${selectedFilter === "recent" ? "text-primary/70" : "text-white/20 group-hover:text-white/50"}`}>{stats.thisWeek}</span>
                </button>
            </div>
        </StaggerItem>

        <StaggerItem className="space-y-2">
             <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-3 h-3" />
                Common Themes
            </h3>
            <div className="flex flex-wrap gap-2">
                {stats.topTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => onSelectFilter(tag)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${selectedFilter === tag ? "bg-white/20 text-white border border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]" : "bg-white/5 border border-white/10 text-white/60 hover:text-primary hover:border-primary/30 hover:-translate-y-0.5"}`}
                    >
                        {tag}
                    </button>
                ))}
                {stats.topTags.length === 0 && (
                    <span className="text-[10px] text-white/20 italic">No themes detected yet.</span>
                )}
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
