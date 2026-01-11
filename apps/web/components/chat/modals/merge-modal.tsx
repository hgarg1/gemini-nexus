"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X as CloseIcon } from "lucide-react";
import { NeonSelect } from "../ui/neon-select";

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    sourceBranchId: string | null;
    targetBranchId: string | null;
    title: string;
    description: string;
  }) => void;
  branches: { label: string; value: string }[];
  defaultSourceId?: string | null;
  defaultTargetId?: string | null;
}

export function MergeModal({
  isOpen,
  onClose,
  onSubmit,
  branches,
  defaultSourceId,
  defaultTargetId,
}: MergeModalProps) {
  const [sourceBranchId, setSourceBranchId] = useState<string | null>(null);
  const [targetBranchId, setTargetBranchId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSourceBranchId(defaultSourceId || null);
      setTargetBranchId(defaultTargetId || null);
      setTitle("");
      setDescription("");
    }
  }, [isOpen, defaultSourceId, defaultTargetId]);

  const handleSubmit = () => {
    onSubmit({ sourceBranchId, targetBranchId, title, description });
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl glass-panel p-8 rounded-[32px] border-white/10 z-[80] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-black tracking-[0.3em] text-secondary/60 uppercase">OPEN_PULL_REQUEST</div>
                <h3 className="text-2xl font-black tracking-tighter">MERGE_INTENT</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <NeonSelect
                  label="SOURCE_BRANCH"
                  tone="secondary"
                  value={sourceBranchId || ""}
                  options={branches}
                  onChange={(value) => setSourceBranchId(value || null)}
                />
                <NeonSelect
                  label="TARGET_BRANCH"
                  tone="primary"
                  value={targetBranchId || ""}
                  options={branches}
                  onChange={(value) => setTargetBranchId(value || null)}
                />
              </div>
              <div>
                <label className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">TITLE</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Merge proposal title"
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-secondary/40"
                />
              </div>
              <div>
                <label className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">DESCRIPTION</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe why this merge is needed."
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-secondary/40 resize-none"
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full mt-2 px-4 py-3 rounded-2xl bg-secondary text-white text-[10px] font-black tracking-[0.3em] uppercase hover:scale-105 transition-all"
              >
                OPEN_PR
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
