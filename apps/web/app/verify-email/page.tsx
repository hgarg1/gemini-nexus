"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Terminal, ShieldCheck, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    // Simulate verification
    setTimeout(() => {
      setStatus("success");
    }, 2000);
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-10" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 text-center"
      >
        <div className="glass-panel p-10 rounded-[32px] border-white/10 shadow-2xl">
          {status === "loading" && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 mx-auto animate-spin">
                <Loader2 className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-xl font-black tracking-tighter">VERIFYING_IDENTITY</h2>
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Cross-referencing encryption tokens...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 mx-auto text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black tracking-tighter">IDENTITY_CONFIRMED</h2>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-[10px] font-bold text-primary tracking-widest leading-relaxed">
                  {">> "} ENTITY_VERIFIED_SUCCESSFULLY
                </p>
              </div>
              <Link href="/login" className="block w-full py-4 bg-primary text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                ACCESS_TERMINAL <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center border border-accent/40 mx-auto text-accent">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black tracking-tighter">VERIFICATION_FAILURE</h2>
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl text-accent text-[10px] font-bold tracking-widest">
                INVALID_OR_EXPIRED_TOKEN
              </div>
              <Link href="/register" className="block text-sm font-bold text-white/40 hover:text-white transition-colors">
                RE_INITIALIZE_REGISTRY
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
