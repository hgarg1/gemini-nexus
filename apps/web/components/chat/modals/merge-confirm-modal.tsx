"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X as CloseIcon } from "lucide-react";
import { NeonSelect } from "../ui/neon-select";

interface MergeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    sourceBranch?: { name: string };
    targetBranch?: { name: string };
  } | null;
  strategyOptions: string[];
  onConfirm: (requestId: string, strategy: string) => void;
}

export function MergeConfirmModal({
  isOpen,
  onClose,
  request,
  strategyOptions,
  onConfirm,
}: MergeConfirmModalProps) {
  const [strategy, setStrategy] = useState(strategyOptions[0] || "squash");

  useEffect(() => {
    if (isOpen && strategyOptions.length > 0) {
      setStrategy(strategyOptions[0] || "squash");
    }
  }, [isOpen, strategyOptions]);

  if (!request) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-panel p-8 rounded-[32px] border-white/10 z-[90] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-black tracking-[0.3em] text-secondary/60 uppercase">MERGE_CONFIRMATION</div>
                <h3 className="text-2xl font-black tracking-tighter">
                  MERGE_{request.sourceBranch?.name}{" -> "}{request.targetBranch?.name}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-white/60">
                {request.sourceBranch?.name}{" -> "}{request.targetBranch?.name}
              </div>
              {strategyOptions.length > 1 ? (
                <NeonSelect
                  label="MERGE_STRATEGY"
                  tone="primary"
                  value={strategy}
                  options={strategyOptions.map((opt) => ({
                    label: opt.replace("-", "_").toUpperCase(),
                    value: opt,
                  }))}
                  onChange={(value) => setStrategy(value)}
                />
              ) : (
                <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">
                  STRATEGY_{strategyOptions[0]?.replace("-", "_")}
                </div>
              )}
              <button
                onClick={() => onConfirm(request.id, strategy)}
                className="w-full mt-2 px-4 py-3 rounded-2xl bg-primary text-black text-[10px] font-black tracking-[0.3em] uppercase hover:scale-105 transition-all"
              >
                CONFIRM_MERGE
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
