"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X as CloseIcon } from "lucide-react";
import { NeonSelect } from "../ui/neon-select";

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { label: string; comment: string; branchId: string | null }) => void;
  editingCheckpoint?: { id: string; label: string; comment: string; branchId?: string } | null;
  branches: { label: string; value: string }[];
  defaultBranchId?: string | null;
}

export function CheckpointModal({
  isOpen,
  onClose,
  onSubmit,
  editingCheckpoint,
  branches,
  defaultBranchId,
}: CheckpointModalProps) {
  const [label, setLabel] = useState("");
  const [comment, setComment] = useState("");
  const [branchId, setBranchId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingCheckpoint) {
        setLabel(editingCheckpoint.label || "");
        setComment(editingCheckpoint.comment || "");
        setBranchId(editingCheckpoint.branchId || null);
      } else {
        setLabel("");
        setComment("");
        setBranchId(defaultBranchId || null);
      }
    }
  }, [isOpen, editingCheckpoint, defaultBranchId]);

  const handleSubmit = () => {
    onSubmit({ label, comment, branchId });
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
                <div className="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase">
                  {editingCheckpoint ? "EDIT_CHECKPOINT" : "NEW_CHECKPOINT"}
                </div>
                <h3 className="text-2xl font-black tracking-tighter">
                  {editingCheckpoint ? "NODE_REFINEMENT" : "DELTA_CAPTURE"}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">LABEL</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Checkpoint label..."
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">COMMENT</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Why is this checkpoint important?"
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary/40 resize-none"
                />
              </div>
              {!editingCheckpoint && (
                <div>
                  <div className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase mb-2">BRANCH</div>
                  <NeonSelect
                    label="TARGET_BRANCH"
                    tone="secondary"
                    value={branchId || ""}
                    options={branches}
                    onChange={(value) => setBranchId(value || null)}
                  />
                </div>
              )}
              <button
                onClick={handleSubmit}
                className="w-full mt-2 px-4 py-3 rounded-2xl bg-primary text-black text-[10px] font-black tracking-[0.3em] uppercase hover:scale-105 transition-all"
              >
                {editingCheckpoint ? "UPDATE_NODE" : "CREATE_NODE"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
