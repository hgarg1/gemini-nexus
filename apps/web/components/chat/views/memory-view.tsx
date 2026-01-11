"use client";

import React from "react";
import { motion } from "framer-motion";
import { Edit3, Trash2 } from "lucide-react";
import { NeonSelect } from "../ui/neon-select";
import { cn } from "../../../lib/utils";

interface MemoryViewProps {
  memories: any[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  sort: string;
  onSortChange: (val: string) => void;
  editingId: string | null;
  labelDraft: string;
  onEditStart: (memory: any) => void;
  onLabelChange: (val: string) => void;
  onSaveLabel: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MemoryView({
  memories,
  loading,
  search,
  onSearchChange,
  sort,
  onSortChange,
  editingId,
  labelDraft,
  onEditStart,
  onLabelChange,
  onSaveLabel,
  onDelete,
}: MemoryViewProps) {
  const filteredMemories = memories
    .filter((memory) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        memory.label?.toLowerCase().includes(query) ||
        memory.content?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sort === "label") {
        return (a.label || "").localeCompare(b.label || "");
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const memoryStage = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };
  const memoryGrid = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const memoryCard = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={memoryStage}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10 relative"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-24 h-64 w-64 rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-accent/10 blur-[120px]" />
      </div>
      <div className="relative max-w-6xl mx-auto space-y-10">
        <motion.div variants={memoryStage} className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] text-primary/70 uppercase">MEMORY_VAULT</div>
            <h2 className="text-3xl font-black tracking-tighter text-white">NEURAL_RECALL_GRID</h2>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 mt-2">
              Persistent intelligence curated by your model.
            </p>
          </div>
          <div className="glass-panel rounded-2xl border-primary/20 px-5 py-4 flex items-center gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div>
              <div className="text-[9px] font-black tracking-[0.3em] text-white/40 uppercase">TOTAL</div>
              <div className="text-2xl font-black tracking-tight text-primary">{memories.length}</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <div className="text-[9px] font-black tracking-[0.3em] text-white/40 uppercase">VISIBLE</div>
              <div className="text-2xl font-black tracking-tight text-secondary">{filteredMemories.length}</div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <motion.div
            variants={memoryStage}
            className="glass-panel rounded-[32px] border-white/15 p-6 space-y-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="SEARCH_MEMORY_STREAM..."
                  className="w-full bg-black/60 border border-white/15 rounded-2xl py-3 pl-4 pr-4 text-[10px] font-black tracking-[0.3em] uppercase outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                />
              </div>
              <div className="min-w-[220px]">
                <NeonSelect
                  label="SORT"
                  tone="primary"
                  value={sort}
                  options={[
                    { label: "RECENT_ACTIVITY", value: "recent" },
                    { label: "LABEL_ORDER", value: "label" },
                  ]}
                  onChange={(v) => onSortChange(v)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">
                INDEXING_MEMORY...
              </div>
            ) : (
              <motion.div variants={memoryGrid} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-4">
                {filteredMemories.map((memory) => (
                  <motion.div
                    key={memory.id}
                    variants={memoryCard}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="rounded-[24px] border border-white/15 bg-gradient-to-br from-black/70 via-black/50 to-black/40 p-5 space-y-4 shadow-[0_16px_50px_rgba(0,0,0,0.4)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {editingId === memory.id ? (
                        <input
                          autoFocus
                          value={labelDraft}
                          onChange={(e) => onLabelChange(e.target.value)}
                          onBlur={() => onSaveLabel(memory.id)}
                          onKeyDown={(e) => e.key === "Enter" && onSaveLabel(memory.id)}
                          className="w-full bg-black/60 border border-primary/40 rounded-xl px-3 py-2 text-xs font-black tracking-[0.2em] uppercase outline-none"
                        />
                      ) : (
                        <div className="text-xs font-black tracking-[0.2em] uppercase text-primary/90">
                          {memory.label}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditStart(memory)}
                          className="p-2 rounded-lg bg-white/10 text-white/40 hover:text-primary transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(memory.id)}
                          className="p-2 rounded-lg bg-white/10 text-white/40 hover:text-accent transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-white/80 leading-relaxed">{memory.content}</div>
                    <div className="flex items-center justify-between text-[9px] font-black tracking-[0.2em] uppercase text-white/30">
                      <span>UPDATED</span>
                      <span>{new Date(memory.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
                {filteredMemories.length === 0 && (
                  <div className="col-span-full py-16 text-center text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">
                    NO_MEMORY_SIGNALS_FOUND
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={memoryStage} className="space-y-6">
            <div className="glass-panel rounded-[28px] border-white/15 p-6 space-y-4">
              <div className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">MEMORY_PROTOCOL</div>
              <p className="text-xs text-white/70 leading-relaxed">
                Your model captures durable memories automatically, even from casual phrasing. Share preferences,
                identity, or recurring needs and it will store them. To remove a memory, ask directly (for example:
                "forget memory: preferred tone").
              </p>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-primary/20 bg-black/60 p-4">
                  <div className="text-[9px] font-black tracking-[0.3em] text-primary/70 uppercase">ADD EXAMPLE</div>
                  <div className="text-[10px] font-bold text-white/50 mt-2 uppercase">"I prefer concise answers."</div>
                </div>
                <div className="rounded-2xl border border-secondary/20 bg-black/60 p-4">
                  <div className="text-[9px] font-black tracking-[0.3em] text-secondary/70 uppercase">REMOVE EXAMPLE</div>
                  <div className="text-[10px] font-bold text-white/50 mt-2 uppercase">"forget memory: preferred tone"</div>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-[28px] border-white/15 p-6 space-y-4">
              <div className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">ACTIVE_CONTEXT</div>
              <p className="text-xs text-white/70 leading-relaxed">
                These memories are injected into the model's context to shape responses. Keep them crisp and specific for maximum signal.
              </p>
              <div className="flex flex-wrap gap-2">
                {memories.slice(0, 6).map((memory) => (
                  <span key={memory.id} className="px-2 py-1 rounded-full text-[8px] font-black tracking-[0.2em] uppercase bg-white/10 text-white/60 border border-white/15">
                    {memory.label}
                  </span>
                ))}
                {memories.length === 0 && (
                  <span className="text-[8px] font-black tracking-[0.3em] text-white/30 uppercase">EMPTY_CONTEXT</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
