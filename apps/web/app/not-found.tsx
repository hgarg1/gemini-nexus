"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Home } from "lucide-react";
import DecryptedText from "@/components/landing/decrypted-text";

export default function NotFound() {
  return (
    <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <div className="absolute inset-0 bg-red-500/5 blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-12 rounded-[40px] border-red-500/20 shadow-[0_0_60px_rgba(239,68,68,0.2)] text-center max-w-lg relative z-10"
      >
        <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/30 mb-8 text-red-500">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <h1 className="text-6xl font-black tracking-tighter mb-2 text-red-500">404</h1>
        <div className="text-xl font-bold tracking-[0.3em] text-white/60 mb-8">
          <DecryptedText text="SIGNAL_LOST" speed={80} />
        </div>

        <p className="text-white/40 text-sm font-mono mb-10 leading-relaxed">
          The requested neural pathway does not exist or has been severed. 
          Coordinate protocols indicate a possible navigation error.
        </p>

        <Link 
          href="/"
          className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black tracking-[0.2em] transition-all hover:border-red-500/50 hover:text-white group"
        >
          <Home className="w-4 h-4 text-white/40 group-hover:text-red-500 transition-colors" />
          RETURN_TO_BASE
        </Link>
      </motion.div>
    </div>
  );
}
