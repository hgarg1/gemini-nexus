"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Lock, 
  Power, 
  Globe, 
  Search, 
  Database, 
  Cpu,
  RefreshCw,
  Check,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomSelect } from "../ui/custom-select";

interface Setting {
  key: string;
  value: string;
}

interface SystemSettingsProps {
  initialSettings: Setting[];
}

export function SystemSettings({ initialSettings }: SystemSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value;

  const updateSetting = async (key: string, value: string) => {
    setIsSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(prev => {
            const next = [...prev];
            const index = next.findIndex(s => s.key === key);
            if (index !== -1) {
                next[index] = updated;
            } else {
                next.push(updated);
            }
            return next;
        });
      }
    } catch (err) {
      console.error("Failed to update setting");
    } finally {
      // Keep toast visible for UX
      setTimeout(() => {
        setIsSaving(null);
      }, 2000);
    }
  };

  return (
    <div className="space-y-10 font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Section */}
        <div className="glass-panel p-8 rounded-[32px] border-white/5 space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Lock className="w-5 h-5" />
            <h2 className="text-sm font-black tracking-[0.3em] uppercase">SECURITY_LEVEL</h2>
          </div>
          
          <CustomSelect 
            label="ENFORCEMENT_POLICY"
            value={getSetting("security_level") || "STRICT"}
            options={[
                { label: "STRICT", value: "STRICT" },
                { label: "BALANCED", value: "BALANCED" },
                { label: "PERMISSIVE", value: "PERMISSIVE" }
            ]}
            onChange={(v) => updateSetting("security_level", v)}
          />

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-white/40" />
                <span className="text-[10px] font-bold text-white/60">PASSKEY_MANDATORY</span>
            </div>
            <button 
                onClick={() => updateSetting("passkey_required", getSetting("passkey_required") === "true" ? "false" : "true")}
                className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    getSetting("passkey_required") === "true" ? "bg-primary" : "bg-white/10"
                )}
            >
                <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    getSetting("passkey_required") === "true" ? "left-7" : "left-1"
                )} />
            </button>
          </div>
        </div>

        {/* Indexing Section */}
        <div className="glass-panel p-8 rounded-[32px] border-white/5 space-y-6">
          <div className="flex items-center gap-3 text-secondary">
            <Search className="w-5 h-5" />
            <h2 className="text-sm font-black tracking-[0.3em] uppercase">INDEXING_CONTROLS</h2>
          </div>

          <CustomSelect 
            label="ROBOTS_PROTOCOL"
            value={getSetting("robots_txt") || "ALLOW_ALL"}
            options={[
                { label: "ALLOW_ALL", value: "ALLOW_ALL" },
                { label: "DISALLOW_ALL", value: "DISALLOW_ALL" },
                { label: "ADMIN_ONLY", value: "ADMIN_ONLY" }
            ]}
            onChange={(v) => updateSetting("robots_txt", v)}
          />

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-white/40" />
                <span className="text-[10px] font-bold text-white/60">DYNAMIC_SITEMAP</span>
            </div>
            <button 
                onClick={() => updateSetting("sitemap_enabled", getSetting("sitemap_enabled") === "false" ? "true" : "false")}
                className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    getSetting("sitemap_enabled") !== "false" ? "bg-secondary" : "bg-white/10"
                )}
            >
                <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    getSetting("sitemap_enabled") !== "false" ? "left-7" : "left-1"
                )} />
            </button>
          </div>
        </div>

        {/* System Operations */}
        <div className="glass-panel p-8 rounded-[32px] border-white/5 space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 text-accent">
            <Power className="w-5 h-5" />
            <h2 className="text-sm font-black tracking-[0.3em] uppercase">SYSTEM_OPERATIONS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <div className="text-[10px] font-black text-white/30 tracking-widest">MAINTENANCE_LOCKDOWN</div>
                <p className="text-[10px] text-white/20 uppercase">Suspend all neural streams for non-admin entities.</p>
                <button 
                    onClick={() => updateSetting("maintenance_mode", getSetting("maintenance_mode") === "true" ? "false" : "true")}
                    className={cn(
                        "w-full py-3 rounded-xl font-black text-[9px] tracking-widest transition-all",
                        getSetting("maintenance_mode") === "true" ? "bg-red-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                >
                    {getSetting("maintenance_mode") === "true" ? "LIFT_LOCKDOWN" : "INITIATE_LOCKDOWN"}
                </button>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <div className="text-[10px] font-black text-white/30 tracking-widest">REGISTRATION_GATE</div>
                <p className="text-[10px] text-white/20 uppercase">Control enrollment of new operatives.</p>
                <button 
                    onClick={() => updateSetting("registration_enabled", getSetting("registration_enabled") === "false" ? "true" : "false")}
                    className={cn(
                        "w-full py-3 rounded-xl font-black text-[9px] tracking-widest transition-all",
                        getSetting("registration_enabled") !== "false" ? "bg-primary text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                >
                    {getSetting("registration_enabled") !== "false" ? "DISABLE_ENROLLMENT" : "ENABLE_ENROLLMENT"}
                </button>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <div className="text-[10px] font-black text-white/30 tracking-widest">DB_PERSISTENCE_PULSE</div>
                <p className="text-[10px] text-white/20 uppercase">Verify integrity of the neural vault storage.</p>
                <button className="w-full py-3 rounded-xl font-black text-[9px] tracking-widest bg-white/5 text-white/40 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> RUN_DIAGNOSTICS
                </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSaving && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-primary text-black text-[10px] font-black tracking-widest shadow-2xl z-50 flex items-center gap-3"
            >
                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                SYNCING_CORE_SETTING: {isSaving.toUpperCase()}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
