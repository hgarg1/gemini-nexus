"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X as CloseIcon } from "lucide-react";
import { NeonSelect } from "../ui/neon-select";

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; baseCheckpointId: string | null }) => void;
  checkpoints: { label: string; value: string }[];
  defaultBaseId?: string | null;
}

export function BranchModal({
  isOpen,
  onClose,
  onSubmit,
  checkpoints,
  defaultBaseId,
}: BranchModalProps) {
  const [name, setName] = useState("");
  const [baseId, setBaseId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setBaseId(defaultBaseId || null);
    }
  }, [isOpen, defaultBaseId]);

  const handleSubmit = () => {
    onSubmit({ name, baseCheckpointId: baseId });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-panel p-8 rounded-[32px] border-white/10 z-[80] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-black tracking-[0.3em] text-secondary/60 uppercase">NEW_BRANCH</div>
                <h3 className="text-2xl font-black tracking-tighter">FORK_THE_STREAM</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">BRANCH_NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="feature-experiment"
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-secondary/40"
                />
              </div>
              <div>
                <div className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase mb-2">BASE_CHECKPOINT</div>
                <NeonSelect
                  label="BASE_POINT"
                  tone="primary"
                  value={baseId || ""}
                  options={checkpoints}
                  onChange={(value) => setBaseId(value || null)}
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full mt-2 px-4 py-3 rounded-2xl bg-secondary text-white text-[10px] font-black tracking-[0.3em] uppercase hover:scale-105 transition-all"
              >
                CREATE_BRANCH
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
