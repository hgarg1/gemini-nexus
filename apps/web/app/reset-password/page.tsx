"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Terminal, Key, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("PASSWORDS_DO_NOT_MATCH");
      return;
    }

    setStatus("loading");
    setError("");

    // Simulate API call
    setTimeout(() => {
      setStatus("success");
    }, 2000);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
         <div className="glass-panel p-10 rounded-[32px] border-white/10 text-center">
            <h2 className="text-xl font-black text-accent tracking-tighter uppercase mb-4">!! INVALID_ACCESS_TOKEN</h2>
            <p className="text-white/40 text-xs font-bold tracking-widest uppercase">The reset link is missing or corrupted.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-10 rounded-[32px] border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 mb-6 text-primary">
              <Key className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">RESET_KEY</h1>
            <p className="text-primary/60 text-xs font-bold tracking-[0.2em] mt-2 uppercase">RE-INITIALIZE SECURITY CREDENTIALS</p>
          </div>

          {status === "success" ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl">
                <p className="text-sm font-bold text-primary leading-relaxed">
                  {">> "} SECURITY_HASH_UPDATED
                </p>
                <p className="text-[10px] text-white/40 mt-2">Your credentials have been successfully reset.</p>
              </div>
              <button 
                onClick={() => router.push("/login")}
                className="w-full py-4 bg-primary text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              >
                RETURN_TO_GATEWAY <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">New_Security_Hash</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input w-full"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">Confirm_Security_Hash</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="cyber-input w-full"
                  placeholder="Confirm new password"
                />
              </div>

              {error && (
                <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl text-accent text-[10px] font-bold tracking-widest text-center uppercase">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 bg-primary text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {status === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    UPDATE_CREDENTIALS <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-primary font-black tracking-widest">LOADING_NEXUS...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
