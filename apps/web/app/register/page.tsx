"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, Mail, User, Check, Lock } from "lucide-react";
import Link from "next/link";
import { registerSchema } from "@/lib/validations";
import { buildPasswordRequirements, defaultPasswordPolicy, validatePasswordWithPolicy } from "@/lib/password-policy";

function RegisterPageContent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState(defaultPasswordPolicy);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const passwordRequirements = useMemo(
    () => buildPasswordRequirements(passwordPolicy, formData.password),
    [passwordPolicy, formData.password]
  );

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const res = await fetch("/api/password-policy");
        const data = await res.json();
        if (res.ok && data.policy) {
          setPasswordPolicy(data.policy);
        }
      } catch (err) {
        console.error("Failed to load password policy");
      }
    };
    loadPolicy();
  }, []);

  const validate = () => {
    const result = registerSchema.safeParse(formData);
    const newErrors: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
    }
    const policyError = validatePasswordWithPolicy(formData.password, passwordPolicy);
    if (policyError) newErrors.password = policyError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "REGISTRATION_FAILED");
      } else {
        const target = callbackUrl ? `/login?registered=true&callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login?registered=true";
        router.push(target);
      }
    } catch (err) {
      setServerError("SYSTEM_ERROR: REGISTRY_UNAVAILABLE");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-panel p-10 rounded-[40px] border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div 
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="w-20 h-20 bg-secondary/20 rounded-3xl flex items-center justify-center border border-secondary/40 mb-6 text-secondary shadow-[0_0_30px_rgba(112,0,255,0.2)]"
            >
              <ShieldCheck className="w-10 h-10" />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tighter text-white">ENTITY_REGISTRY</h1>
            <p className="text-secondary/60 text-[10px] font-bold tracking-[0.3em] mt-3 uppercase">SECURE AGENT INITIALIZATION</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                <User className="w-3 h-3" /> Full_Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={cn(
                  "cyber-input w-full transition-all",
                  errors.name && "border-accent/50 bg-accent/5"
                )}
                placeholder="Agent Designation"
              />
              <AnimatePresence>
                {errors.name && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-accent text-[10px] font-bold tracking-tight px-1"
                  >
                    !! {errors.name.toUpperCase()}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                <Mail className="w-3 h-3" /> Communication_Node
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
              <AnimatePresence>
                {errors.email && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-accent text-[10px] font-bold tracking-tight px-1"
                  >
                    !! {errors.email.toUpperCase()}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Security_Hash
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn(
                    "cyber-input w-full transition-all",
                    errors.password && "border-accent/50 bg-accent/5"
                  )}
                  placeholder="Enter password"
                />
                <AnimatePresence>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-accent text-[10px] font-bold tracking-tight px-1"
                    >
                      !! {errors.password.toUpperCase()}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="grid grid-cols-2 gap-2 px-1">
                {passwordRequirements.map((req, i) => {
                  const isMet = req.valid;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded flex items-center justify-center border transition-all duration-300",
                        isMet ? "bg-primary border-primary" : "bg-white/5 border-white/10"
                      )}>
                        {isMet && <Check className="w-2 h-2 text-black" />}
                      </div>
                      <span className={cn(
                        "text-[9px] font-black tracking-tight transition-colors duration-300",
                        isMet ? "text-primary" : "text-white/20"
                      )}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-4 bg-accent/10 border border-accent/30 rounded-2xl text-accent text-[10px] font-black tracking-[0.2em] text-center uppercase"
                >
                  !! {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-secondary text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(112,0,255,0.3)]"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  INITIALIZE ENTITY <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-white/30 text-[10px] font-bold tracking-[0.3em] uppercase">
            ALREADY DEPLOYED? <Link href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"} className="text-secondary hover:text-secondary/80 transition-colors">ACCESS_GATEWAY</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-secondary">LOADING_REGISTRY...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
