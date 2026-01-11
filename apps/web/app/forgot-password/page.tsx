"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ArrowRight, Mail, ShieldAlert, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = forgotSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Invalid input");
      return;
    }

    setStatus("loading");
    setError("");
    
    // Simulate API call to send reset link
    setTimeout(() => {
      setStatus("success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 blur-[120px] rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-10 rounded-[40px] border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div 
              animate={status === "success" ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}}
              className="w-20 h-20 bg-accent/20 rounded-3xl flex items-center justify-center border border-accent/40 mb-6 text-accent shadow-[0_0_30px_rgba(255,0,229,0.2)]"
            >
              <ShieldAlert className="w-10 h-10" />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Recover_Key</h1>
            <p className="text-accent/60 text-[10px] font-bold tracking-[0.3em] mt-3 uppercase">RESET ACCESS CREDENTIALS</p>
          </div>

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="p-8 bg-primary/5 border border-primary/20 rounded-3xl">
                  <div className="flex justify-center mb-4">
                    <CheckCircle2 className="w-12 h-12 text-primary animate-pulse" />
                  </div>
                  <p className="text-sm font-black text-primary leading-relaxed uppercase tracking-widest">
                    {">> "} LINK_TRANSMITTED
                  </p>
                  <p className="text-[10px] text-white/30 mt-4 leading-relaxed font-bold uppercase tracking-wider">
                    Secure reset link sent to communication node. Verify your inbox to restore access.
                  </p>
                </div>
                <Link href="/login" className="block w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-white/10 transition-all uppercase">
                  RETURN_TO_GATEWAY
                </Link>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                onSubmit={handleSubmit} 
                className="space-y-8"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Registered_Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="cyber-input w-full transition-all"
                    placeholder="identity@nexus.sh"
                  />
                  <AnimatePresence>
                    {error && (
                      <motion.p 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-accent text-[9px] font-black tracking-widest px-1 uppercase"
                      >
                        !! {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-5 bg-accent text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(255,0,229,0.3)]"
                >
                  {status === "loading" ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      TRANSMIT RESET LINK <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                <Link href="/login" className="block text-center text-[10px] font-black text-white/20 hover:text-white transition-colors tracking-[0.3em] uppercase">
                  BACK_TO_ACCESS_GATEWAY
                </Link>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}