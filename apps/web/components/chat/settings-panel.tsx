"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Shield, Cpu } from "lucide-react";
import { ConfigGroup, ConfigSlider } from "./ui/config-components";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    temperature: number;
    topP: number;
    maxOutputTokens: number;
    customKey: string;
    modelName: string;
  };
  setConfig: (config: any) => void;
}

export function SettingsPanel({ isOpen, onClose, config, setConfig }: SettingsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-4 right-4 bottom-4 w-[400px] glass-panel rounded-[32px] border-white/10 p-8 z-50 overflow-y-auto shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-2xl font-black tracking-tighter">CONTROL</h2>
                <div className="text-[10px] font-bold text-primary tracking-[0.2em]">CORE_PARAMETERS</div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>
            <div className="space-y-12">
              <ConfigGroup label="ARCHITECTURE">
                <ConfigSlider
                  label="Temperature"
                  value={config.temperature}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(v) => setConfig({ ...config, temperature: v })}
                  color="primary"
                />
                <ConfigSlider
                  label="Top P"
                  value={config.topP}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(v) => setConfig({ ...config, topP: v })}
                  color="secondary"
                />
                <ConfigSlider
                  label="Max Tokens"
                  value={config.maxOutputTokens}
                  min={256}
                  max={8192}
                  step={256}
                  onChange={(v) => setConfig({ ...config, maxOutputTokens: v })}
                  color="accent"
                />
              </ConfigGroup>
              <ConfigGroup label="AUTHENTICATION">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 tracking-[0.1em]">SYSTEM_OVERRIDE_KEY</label>
                  <div className="relative group">
                    <input
                      type="password"
                      placeholder="ENTER_PRIVATE_KEY..."
                      value={config.customKey}
                      onChange={(e) => setConfig({ ...config, customKey: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-primary/50 outline-none transition-all pr-12"
                    />
                    <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                  </div>
                </div>
              </ConfigGroup>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black tracking-tight">ENGINE_HEALTH</div>
                    <div className="text-[10px] text-primary/60 font-bold">ALL SYSTEMS NOMINAL</div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} className="h-full bg-primary" />
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
