"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ShieldCheck, ChevronRight, Loader2, AlertCircle, Sparkles } from "lucide-react";
import DecryptedText from "@/components/landing/decrypted-text";
import { cn } from "@/lib/utils";

export default function JoinPage() {
  const { code } = useParams();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "error" | "ready" | "pending" | "success">("loading");
  const [error, setError] = useState("");
  const [org, setOrg] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const validateLink = async () => {
      try {
        const res = await fetch(`/api/join/${code}`);
        const data = await res.json();
        if (res.ok) {
          setOrg(data.organization);
          setState("ready");
        } else {
          setError(data.error);
          setState("error");
        }
      } catch (err) {
        setError("Network failure in the neural bridge.");
        setState("error");
      }
    };
    validateLink();
  }, [code]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const res = await fetch(`/api/join/${code}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (data.status === "PENDING_APPROVAL") {
          setState("pending");
        } else {
          setState("success");
        }
      } else {
        setError(data.error);
        if (res.status === 401) {
            router.push(`/login?callbackUrl=/join/${code}`);
        }
      }
    } catch (err) {
      setError("Transmission failed.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full" />

      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="text-[10px] font-black tracking-[0.4em] text-primary/60">SYNCHRONIZING_LINK...</div>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-10 rounded-[40px] border-red-500/20 text-center max-w-md"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
            <h2 className="text-xl font-black mb-2">LINK_CORRUPTION</h2>
            <p className="text-white/40 text-sm mb-8 font-mono">{error}</p>
            <button onClick={() => router.push("/")} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black tracking-widest hover:bg-white/10 transition-all">RETURN_TO_BASE</button>
          </motion.div>
        )}

        {state === "ready" && (
          <motion.div 
            key="ready"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg text-center"
          >
            <div className="mb-8">
                <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 rounded-[32px] bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-6 shadow-[0_0_40px_rgba(0,242,255,0.2)]"
                >
                    <Building2 className="w-10 h-10" />
                </motion.div>
                <div className="text-[10px] font-black tracking-[0.4em] text-primary/60 uppercase mb-2">INCOMING_INVITATION</div>
                <h1 className="text-4xl font-black tracking-tighter">
                    <DecryptedText text={org.name.toUpperCase()} speed={100} />
                </h1>
                <p className="text-white/40 text-sm mt-4 leading-relaxed px-10">
                    You have been granted a digital handshake invitation to join the <span className="text-white font-bold">{org.name}</span> sector in the Nexus.
                </p>
            </div>

            <div className="space-y-4">
                <button 
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full py-5 bg-primary text-black font-black rounded-2xl text-[10px] tracking-[0.3em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(0,242,255,0.3)] flex items-center justify-center gap-3"
                >
                    {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <>INITIATE_ONBOARDING <ChevronRight className="w-4 h-4" /></>}
                </button>
                <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Security clearance level: RESTRICTED</div>
            </div>
          </motion.div>
        )}

        {state === "pending" && (
          <motion.div 
            key="pending"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-12 rounded-[40px] border-primary/20 text-center max-w-lg"
          >
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/30 mb-8 text-primary animate-pulse">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter mb-4">UPLINK_PENDING</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-10 font-mono">
                Your credentials have been successfully cached. A sector administrator must authorize your node before the neural stream can be established.
            </p>
            <button onClick={() => router.push("/chat")} className="w-full py-4 bg-primary text-black text-[10px] font-black tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(0,242,255,0.3)] transition-all">CHECK_SYSTEM_STATUS</button>
          </motion.div>
        )}

        {state === "success" && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-12 rounded-[40px] border-green-500/20 text-center max-w-lg shadow-[0_0_60px_rgba(34,197,94,0.15)]"
          >
            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-3xl flex items-center justify-center border border-green-500/30 mb-8 text-green-500">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter mb-4 text-green-500">UPLINK_ESTABLISHED</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-10 font-mono">
                Handshake successful. You are now a full member of <span className="text-white">{org.name}</span>. Access protocols have been updated.
            </p>
            <button onClick={() => router.push("/chat")} className="w-full py-4 bg-green-500 text-black text-[10px] font-black tracking-widest rounded-2xl transition-all">ENTER_THE_NEXUS</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
