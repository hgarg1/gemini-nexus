"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, RefreshCcw } from "lucide-react";
import DecryptedText from "@/components/landing/decrypted-text";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <div className="absolute inset-0 bg-orange-500/5 blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-12 rounded-[40px] border-orange-500/20 shadow-[0_0_60px_rgba(249,115,22,0.2)] text-center max-w-lg relative z-10"
      >
        <div className="w-20 h-20 mx-auto bg-orange-500/10 rounded-3xl flex items-center justify-center border border-orange-500/30 mb-8 text-orange-500">
          <AlertOctagon className="w-10 h-10" />
        </div>

        <h1 className="text-4xl font-black tracking-tighter mb-2 text-orange-500">SYSTEM_FAILURE</h1>
        <div className="text-sm font-bold tracking-[0.2em] text-white/40 mb-8 uppercase">
          ERROR_CODE: {error.digest || "UNKNOWN_EXCEPTION"}
        </div>

        <p className="text-white/60 text-xs font-mono mb-10 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
          {error.message || "An unexpected error has occurred in the neural core."}
        </p>

        <button 
          onClick={reset}
          className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-black rounded-2xl text-xs font-black tracking-[0.2em] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
        >
          <RefreshCcw className="w-4 h-4" />
          REBOOT_SYSTEM
        </button>
      </motion.div>
    </div>
  );
}
