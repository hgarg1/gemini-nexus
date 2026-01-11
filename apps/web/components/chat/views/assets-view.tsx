"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, X as CloseIcon, ExternalLink } from "lucide-react";
import { NeonSelect } from "../ui/neon-select";
import { cn } from "../../../lib/utils";

interface AssetsViewProps {
  assets: any[];
  filter: { ratio: string; role: string; label: string };
  onFilterChange: (newFilter: { ratio: string; role: string; label: string }) => void;
  availableLabels: string[];
  onToggleLabel: (label: string) => void;
  onOpenViewer: (images: string[], index: number) => void;
  onResetFilters: () => void;
}

const containerVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

export function AssetsView({
  assets,
  filter,
  onFilterChange,
  availableLabels,
  onToggleLabel,
  onOpenViewer,
  onResetFilters,
}: AssetsViewProps) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-8 pb-10"
    >
      {/* Tactical Filter Console */}
      <div className="space-y-6 pt-2">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-black/70 via-panel/70 to-black/80 p-6">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 left-4 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 right-6 h-32 w-32 rounded-full bg-secondary/20 blur-3xl" />
          </div>
          <div className="relative space-y-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase">FILTER_MATRIX</div>
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mt-1">
                  Refine visual memory stream
                </div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black tracking-[0.3em] text-white/20 uppercase">VISIBLE</div>
                <div className="text-lg font-black tracking-tight text-primary">{assets.length}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <NeonSelect
                label="RATIO"
                tone="primary"
                value={filter.ratio}
                options={[
                  { label: "ALL_RATIOS", value: "all" },
                  { label: "SQUARE", value: "square" },
                  { label: "LANDSCAPE", value: "landscape" },
                  { label: "PORTRAIT", value: "portrait" },
                ]}
                onChange={(v) => onFilterChange({ ...filter, ratio: v })}
              />
              <NeonSelect
                label="SOURCE"
                tone="secondary"
                value={filter.role}
                options={[
                  { label: "ALL_SOURCES", value: "all" },
                  { label: "UPLOADS", value: "user" },
                  { label: "ENGINE_OUT", value: "model" },
                ]}
                onChange={(v) => onFilterChange({ ...filter, role: v })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filter.ratio !== "all" && (
                <span className="px-2 py-1 rounded-full text-[8px] font-black tracking-[0.2em] uppercase bg-primary/10 text-primary border border-primary/30">
                  RATIO:{filter.ratio}
                </span>
              )}
              {filter.role !== "all" && (
                <span className="px-2 py-1 rounded-full text-[8px] font-black tracking-[0.2em] uppercase bg-secondary/10 text-secondary border border-secondary/30">
                  SOURCE:{filter.role}
                </span>
              )}
              {filter.label && (
                <span className="px-2 py-1 rounded-full text-[8px] font-black tracking-[0.2em] uppercase bg-white/10 text-white/70 border border-white/20">
                  TAG:{filter.label}
                </span>
              )}
              {filter.ratio !== "all" || filter.role !== "all" || filter.label ? (
                <button
                  onClick={onResetFilters}
                  className="px-2 py-1 rounded-full text-[8px] font-black tracking-[0.3em] uppercase text-white/30 hover:text-accent transition-colors"
                >
                  RESET
                </button>
              ) : (
                <span className="text-[8px] font-black tracking-[0.3em] text-white/15 uppercase">NO_FILTERS_ACTIVE</span>
              )}
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">
                <Activity className="w-3 h-3" />
              </div>
              <input
                placeholder="SEARCH_BY_LABEL..."
                value={filter.label}
                onChange={(e) => onFilterChange({ ...filter, label: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-9 pr-12 text-[10px] font-black tracking-widest outline-none focus:border-primary/30 transition-all placeholder:text-white/10"
              />
              {filter.label && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filter, label: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors"
                >
                  <CloseIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Neural Tag Cloud */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-secondary/40 tracking-[0.3em] uppercase">NEURAL_TAG_CLOUD</label>
            <span className="text-[8px] font-mono text-white/10">{availableLabels.length} TAGS</span>
          </div>
          <div className="flex flex-wrap gap-2 p-4 glass-panel rounded-2xl border-white/5">
            {availableLabels.map((l: string) => (
              <button
                key={l}
                onClick={() => onToggleLabel(l)}
                className={cn(
                  "px-2.5 py-1.5 rounded-full text-[8px] font-black tracking-[0.25em] transition-all uppercase border",
                  filter.label === l
                    ? "bg-primary text-black border-primary shadow-[0_0_12px_rgba(0,242,255,0.35)]"
                    : "bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white"
                )}
              >
                {l}
              </button>
            ))}
            {availableLabels.length === 0 && (
              <div className="text-[8px] font-bold text-white/10 italic py-2">AWAITING_NEURAL_INDEXING...</div>
            )}
          </div>
        </div>
      </div>

      {/* High-Fidelity Asset Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <label className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">MATCHING_INDEX</label>
            <div className="text-[9px] font-bold tracking-[0.2em] text-white/20 uppercase mt-1">
              {filter.label ? `TAG:${filter.label}` : "FULL_SCAN"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-primary">{assets.length} UNITS</span>
            <span className="w-2 h-2 rounded-full bg-primary/60 shadow-[0_0_10px_rgba(0,242,255,0.5)]" />
          </div>
        </div>
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
        >
          {assets.map((asset: any, i: number) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => {
                const assetUrls = assets.map((item: any) => item.url);
                onOpenViewer(assetUrls, i);
              }}
              className="aspect-square rounded-[22px] overflow-hidden border border-white/10 cursor-pointer relative group bg-gradient-to-br from-black/60 via-panel/70 to-black/80 shadow-xl"
            >
              <img src={asset.url} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />

              {/* Tactical Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 flex flex-col justify-end gap-2">
                <div className="flex flex-wrap gap-1">
                  {asset.labels?.slice(0, 4).map((l: string, j: number) => (
                    <span
                      key={j}
                      className="text-[6px] font-black bg-white/10 text-white px-1.5 py-0.5 rounded-sm uppercase backdrop-blur-md border border-white/10"
                    >
                      {l}
                    </span>
                  ))}
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-[6px] font-black text-primary uppercase tracking-[0.2em]">
                    {asset.ratio || "RAW"}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-white/40" />
                </div>
              </div>

              {/* Static Source Indicator */}
              <div
                className={cn(
                  "absolute top-2 right-2 w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentcolor]",
                  asset.role === "user" ? "bg-primary text-primary" : "bg-secondary text-secondary"
                )}
              />
            </motion.div>
          ))}
        </motion.div>
        {assets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
            <div className="w-12 h-12 rounded-full border border-dashed border-white/40 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-black tracking-widest uppercase text-center leading-relaxed">
              ZERO_MATCHES_FOUND
              <br />
              RE_CALIBRATE_SEARCH_PARAMS
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}