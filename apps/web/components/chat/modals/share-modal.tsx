"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export function ShareModal({ isOpen, onClose, shareUrl }: ShareModalProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-panel p-10 rounded-[32px] border-white/10 z-[70] shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 mb-6 text-primary">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter">COLLABORATIVE_LINK</h2>
              <p className="text-white/40 text-xs font-bold tracking-[0.2em] mt-2 mb-8 uppercase">
                SHARE THIS SESSION FOR REAL-TIME SYNC
              </p>
              <div className="w-full relative group">
                <input
                  readOnly
                  value={shareUrl}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-32 text-sm font-mono text-primary outline-none focus:border-primary/50 transition-all"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-black font-black text-xs rounded-xl hover:scale-105 active:scale-95 transition-all"
                >
                  COPY_ID
                </button>
              </div>
              <div className="mt-8 flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl w-full">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <p className="text-[10px] text-primary/60 font-bold text-left uppercase leading-relaxed">
                  {" >> "} SECURITY_PROTOCOL: Only verified entities with this link can access the neural stream. Link
                  respects LOCAL/PROD environment routing.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-8 text-[10px] font-black tracking-[0.3em] text-white/20 hover:text-white transition-colors uppercase"
              >
                CLOSE_CHANNEL
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
