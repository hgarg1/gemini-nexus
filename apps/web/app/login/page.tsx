"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Shield, ArrowRight, Github, Mail, Lock, Key } from "lucide-react";
import Link from "next/link";
import { loginSchema } from "@/lib/validations";
import { startAuthentication } from "@simplewebauthn/browser";
import { cn } from "../../lib/utils";

function LoginPageContent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/chat";

  const validate = () => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setServerError("");

    try {
      const result = await signIn("credentials", {
        ...formData,
        redirect: false,
      });

      if (result?.error) {
        setServerError("AUTHENTICATION_FAILED: INVALID_CREDENTIALS");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setServerError("SYSTEM_ERROR: GATEWAY_TIMEOUT");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!formData.email) {
      setErrors({ email: "Encryption_ID (Email) required for Passkey" });
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      // 1. Get options
      const resp = await fetch("/api/auth/webauthn/authenticate/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      // 2. Auth
      const authResp = await startAuthentication(data.options);

      // 3. Verify
      const verificationResp = await fetch("/api/auth/webauthn/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResp, userId: data.userId }),
      });

      const verificationJSON = await verificationResp.json();

      if (verificationJSON && verificationJSON.verified) {
        // For now, we redirect. In a full implementation, we'd swap this for a session token.
        // We'll show a success state.
        setServerError("PASSKEY_VERIFIED... REDIRECTING");
        setTimeout(() => {
           router.push(callbackUrl);
        }, 1000);
      } else {
        throw new Error("Verification failed");
      }
    } catch (err: any) {
      setServerError(err.message || "Passkey failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-10 rounded-[40px] border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/40 mb-6 text-primary shadow-[0_0_30px_rgba(0,242,255,0.2)]"
            >
              <Terminal className="w-10 h-10" />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tighter">NEXUS_ACCESS</h1>
            <p className="text-primary/60 text-[10px] font-bold tracking-[0.3em] mt-3 uppercase">SECURE GATEWAY AUTHORIZATION</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                <Mail className="w-3 h-3" /> Encryption_ID
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={cn(
                  "cyber-input w-full transition-all",
                  errors.email && "border-accent/50 bg-accent/5"
                )}
                placeholder="identity@nexus.sh"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Access_Key
                </label>
                <Link href="/forgot-password" virtual-scroll="true" className="text-[9px] font-black text-primary/40 hover:text-primary transition-colors tracking-widest uppercase">
                  Recover_Key?
                </Link>
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={cn(
                  "cyber-input w-full transition-all",
                  errors.password && "border-accent/50 bg-accent/5"
                )}
                placeholder="••••••••••••"
              />
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-accent/10 border border-accent/30 rounded-2xl text-accent text-[10px] font-black tracking-[0.2em] text-center uppercase"
                >
                  !! {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(0,242,255,0.3)]"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                />
              ) : (
                <>
                  INITIALIZE SESSION <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={loading}
            className="w-full mt-4 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 hover:border-primary/30 transition-all disabled:opacity-50 group"
          >
            <Key className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-black tracking-[0.2em]">SIGN_IN_WITH_PASSKEY</span>
          </button>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase font-black">
              <span className="bg-panel px-4 text-white/20 tracking-[0.4em]">or sync via</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => signIn("google", { callbackUrl })}
              className="py-4 px-4 glass-panel rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 transition-all text-xs font-bold border-white/5 hover:border-white/10"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              GOOGLE
            </button>
            <button className="py-4 px-4 glass-panel rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 transition-all text-xs font-bold border-white/5 hover:border-white/10">
              <Github className="w-4 h-4" />
              GITHUB
            </button>
          </div>

          <p className="mt-10 text-center text-white/30 text-[10px] font-bold tracking-[0.3em] uppercase">
            NEW AGENT? <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary hover:text-primary/80 transition-colors">REGISTER_ENTITY</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-primary">LOADING_INTERFACE...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
