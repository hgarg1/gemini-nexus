"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Smartphone, Copy, Check, Terminal, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";

export default function MobileConnectPage() {
  const { data: session, status } = useSession();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login?callbackUrl=/mobile-connect");
    }
    
    if (session?.user) {
        fetch("/api/user/key")
            .then(res => res.json())
            .then(data => {
                if (data.apiKey) setApiKey(data.apiKey);
            });
    }
  }, [session, status]);

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-20" />
        
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md p-8 glass-panel border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl"
        >
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/30 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                    <Smartphone className="w-10 h-10 text-cyan-400" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter mb-2">MOBILE LINK</h1>
                <p className="text-white/40 text-xs font-mono tracking-widest uppercase">
                    Secure Neural Handshake
                </p>
            </div>

            <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Identity</span>
                        <span className="text-xs font-bold text-white">{session?.user?.name}</span>
                    </div>
                    <div className="h-px w-full bg-white/10" />
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Neural Key</span>
                        {apiKey ? (
                            <div className="relative group">
                                <code className="block w-full p-4 rounded-xl bg-black/50 border border-white/10 text-xs text-cyan-400 font-mono break-all hover:border-cyan-500/30 transition-colors">
                                    {apiKey}
                                </code>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        ) : (
                            <div className="h-12 w-full bg-white/5 animate-pulse rounded-xl" />
                        )}
                    </div>
                </div>

                <button
                    onClick={handleCopy}
                    disabled={!apiKey}
                    className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex items-center justify-center gap-3 group"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-xs font-bold text-green-400 tracking-widest">COPIED TO CLIPBOARD</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 text-white/60 group-hover:text-white" />
                            <span className="text-xs font-bold text-white/60 group-hover:text-white tracking-widest">COPY ACCESS KEY</span>
                        </>
                    )}
                </button>

                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] text-white/20 font-bold">OR</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                <button
                    className="w-full py-4 rounded-xl bg-cyan-500 text-black font-black tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    onClick={() => window.location.href = `exp://?token=${apiKey}`} // Placeholder scheme
                >
                    <Terminal className="w-4 h-4" />
                    AUTO-CONFIGURE TERMINAL
                </button>
            </div>

            <div className="mt-8 text-center">
                <p className="text-[10px] text-white/20 leading-relaxed max-w-xs mx-auto">
                    WARNING: This key grants full neural access to your account. Do not share it with unauthorized personnel.
                </p>
            </div>
        </motion.div>
    </div>
  );
}
