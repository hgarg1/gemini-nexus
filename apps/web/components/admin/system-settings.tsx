"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Lock, 
  Power, 
  Globe, 
  Search, 
  RefreshCw,
  KeyRound,
  Check,
  Megaphone,
  ShieldAlert
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { buildPasswordRequirements, resolvePasswordPolicy } from "@/lib/password-policy";
import { CustomSelect } from "../ui/custom-select";

interface Setting {
  key: string;
  value: string;
}

interface SystemSettingsProps {
  initialSettings: Setting[];
}

export function SystemSettings({ initialSettings }: SystemSettingsProps) {
  const getSettingValue = (key: string, source: Setting[]) => source.find(s => s.key === key)?.value;
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [policyDraft, setPolicyDraft] = useState(() => resolvePasswordPolicy(getSettingValue("password_policy", initialSettings)));
  const [policyProbe, setPolicyProbe] = useState("");
  const { data: session } = useSession();
  const permissions = ((session?.user as any)?.permissions || []) as string[];
  const canManagePasswordPolicy = permissions.includes("settings:password-policy");

  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [restrictedWords, setRestrictedWords] = useState(getSettingValue("restricted_keywords", initialSettings) || "");

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value;
  const policyRequirements = useMemo(
    () => buildPasswordRequirements(policyDraft, policyProbe),
    [policyDraft, policyProbe]
  );

  useEffect(() => {
    setPolicyDraft(resolvePasswordPolicy(getSetting("password_policy")));
    setRestrictedWords(getSetting("restricted_keywords") || "");
  }, [settings]);

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

  const handlePolicyChange = (patch: Partial<typeof policyDraft>) => {
    if (!canManagePasswordPolicy) return;
    setPolicyDraft(prev => ({ ...prev, ...patch }));
  };

  const handlePolicySave = () => {
    if (!canManagePasswordPolicy) return;
    updateSetting("password_policy", JSON.stringify(policyDraft));
  };

  const handleBroadcast = () => {
    if (!broadcastMsg.trim()) return;
    console.log(`[GLOBAL_BROADCAST] ${broadcastMsg}`);
    setBroadcastMsg("");
    alert("SYSTEM ALERT DISPATCHED TO ALL CHANNELS");
  };

  return (
    <div className="space-y-10 font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Broadcast */}
        <div className="glass-panel p-8 rounded-[32px] border-white/5 space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Megaphone className="w-5 h-5" />
            <h2 className="text-sm font-black tracking-[0.3em] uppercase">GLOBAL_BROADCAST</h2>
          </div>
          <div className="space-y-4">
            <textarea 
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white tracking-wide placeholder:text-white/20 outline-none focus:border-primary/50 transition-all uppercase resize-none"
              placeholder="ENTER_SYSTEM_ALERT_MESSAGE..."
            />
            <button 
              onClick={handleBroadcast}
              disabled={!broadcastMsg.trim()}
              className="w-full py-4 rounded-xl bg-primary text-black text-[10px] font-black tracking-[0.3em] uppercase hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            >
              TRANSMIT_ALERT
            </button>
          </div>
        </div>

        {/* Content Moderation */}
        <div className="glass-panel p-8 rounded-[32px] border-white/5 space-y-6">
          <div className="flex items-center gap-3 text-red-500">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-sm font-black tracking-[0.3em] uppercase">CONTENT_MODERATION</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">RESTRICTED_KEYWORDS</label>
              <textarea 
                value={restrictedWords}
                onChange={(e) => setRestrictedWords(e.target.value)}
                className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white tracking-wide placeholder:text-white/20 outline-none focus:border-red-500/50 transition-all uppercase resize-none"
                placeholder="KEYWORD1, KEYWORD2..."
              />
            </div>
            <button 
              onClick={() => updateSetting("restricted_keywords", restrictedWords)}
              className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black tracking-[0.3em] uppercase hover:bg-white/10 transition-all"
            >
              UPDATE_FILTERS
            </button>
          </div>
        </div>

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

        {/* Password Policy */}
        <div className="glass-panel p-8 rounded-[32px] border-white/5 space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <KeyRound className="w-5 h-5" />
            <h2 className="text-sm font-black tracking-[0.3em] uppercase">PASSWORD_POLICY</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">MIN_LENGTH</label>
              <div className="relative">
                <input
                  type="number"
                  min={6}
                  max={64}
                  value={policyDraft.minLength}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isNaN(next)) return;
                    handlePolicyChange({ minLength: Math.min(64, Math.max(6, next)) });
                  }}
                  className={cn(
                    "w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-xs font-bold text-white outline-none transition-all",
                    !canManagePasswordPolicy && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!canManagePasswordPolicy}
                />
                <div className="absolute inset-y-0 right-4 flex items-center text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  chars
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">POLICY_SIGNAL</label>
              <input
                type="password"
                value={policyProbe}
                onChange={(e) => setPolicyProbe(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-xs font-bold text-white/70 outline-none transition-all focus:border-primary/40"
                placeholder="Test key"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ToggleCard
              label="REQUIRE_UPPERCASE"
              active={policyDraft.requireUppercase}
              onToggle={() => handlePolicyChange({ requireUppercase: !policyDraft.requireUppercase })}
              disabled={!canManagePasswordPolicy}
            />
            <ToggleCard
              label="REQUIRE_LOWERCASE"
              active={policyDraft.requireLowercase}
              onToggle={() => handlePolicyChange({ requireLowercase: !policyDraft.requireLowercase })}
              disabled={!canManagePasswordPolicy}
            />
            <ToggleCard
              label="REQUIRE_NUMBER"
              active={policyDraft.requireNumber}
              onToggle={() => handlePolicyChange({ requireNumber: !policyDraft.requireNumber })}
              disabled={!canManagePasswordPolicy}
            />
            <ToggleCard
              label="REQUIRE_SPECIAL"
              active={policyDraft.requireSpecial}
              onToggle={() => handlePolicyChange({ requireSpecial: !policyDraft.requireSpecial })}
              disabled={!canManagePasswordPolicy}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 px-1">
            {policyRequirements.map((req) => (
              <div key={req.label} className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded flex items-center justify-center border transition-all duration-300",
                  req.valid ? "bg-primary border-primary" : "bg-white/5 border-white/10"
                )}>
                  {req.valid && <Check className="w-2 h-2 text-black" />}
                </div>
                <span className={cn(
                  "text-[9px] font-black tracking-tight transition-colors duration-300",
                  req.valid ? "text-primary" : "text-white/30"
                )}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handlePolicySave}
            disabled={!canManagePasswordPolicy}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-[9px] tracking-widest transition-all uppercase",
              canManagePasswordPolicy
                ? "bg-primary text-black hover:scale-[1.02] active:scale-95"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            )}
          >
            APPLY_POLICY
          </button>
          {!canManagePasswordPolicy && (
            <div className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em]">
              RBAC_LOCK: settings:password-policy
            </div>
          )}
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

        {/* Squad Protocols */}
        <div className="glass-panel p-8 rounded-[32px] border-white/5 space-y-6">
          <div className="flex items-center gap-3 text-white">
            <Shield className="w-5 h-5" />
            <h2 className="text-sm font-black tracking-[0.3em] uppercase">SQUAD_PROTOCOLS</h2>
          </div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">
            Configure permitted parameters for user-created squads.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {["isPublic", "allowInvites", "description"].map((key) => {
              const currentSettings = JSON.parse(getSetting("allowed_squad_settings") || '["isPublic", "allowInvites", "description"]');
              const isActive = currentSettings.includes(key);
              
              const toggleSetting = () => {
                const newSettings = isActive 
                  ? currentSettings.filter((k: string) => k !== key)
                  : [...currentSettings, key];
                updateSetting("allowed_squad_settings", JSON.stringify(newSettings));
              };

              return (
                <ToggleCard
                  key={key}
                  label={`ALLOW_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`}
                  active={isActive}
                  onToggle={toggleSetting}
                />
              );
            })}
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

function ToggleCard({
  label,
  active,
  onToggle,
  disabled
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "p-4 rounded-2xl border text-left transition-all",
        active
          ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_20px_rgba(0,242,255,0.12)]"
          : "bg-white/5 border-white/10 text-white/40 hover:border-white/20",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="text-[9px] font-black tracking-[0.25em] uppercase">{label}</div>
      <div className="mt-2 text-[8px] font-bold uppercase tracking-widest">
        {active ? "ENABLED" : "OPTIONAL"}
      </div>
    </button>
  );
}
