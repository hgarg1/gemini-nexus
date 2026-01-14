"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Type, Layout, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatAppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings?: any;
  onSave: (settings: any) => void;
}

export function ChatAppearanceModal({ isOpen, onClose, initialSettings, onSave }: ChatAppearanceModalProps) {
  const [settings, setSettings] = useState(initialSettings || {
    theme: "cyber",
    bubbleColor: "#00f2ff",
    fontFamily: "mono",
    density: "comfortable",
    background: null,
  });

  React.useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const themes = [
    { id: "cyber", label: "CYBERPUNK", color: "#00f2ff" },
    { id: "minimal", label: "MINIMALIST", color: "#ffffff" },
    { id: "organic", label: "ORGANIC", color: "#10b981" },
    { id: "void", label: "THE_VOID", color: "#a855f7" },
  ];

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-[110] p-4"
          >
            <div className="w-full max-w-lg glass-panel rounded-[32px] border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/40">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-black tracking-widest uppercase text-white">
                    INTERFACE_CUSTOMIZATION
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                    <Layout className="w-3 h-3" /> VISUAL_THEME
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSettings({ ...settings, theme: t.id })}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all",
                          settings.theme === t.id
                            ? "bg-white/10 border-white/20"
                            : "bg-white/5 border-transparent hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                          <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                    <Palette className="w-3 h-3" /> ACCENT_COLOR_HEX
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={settings.bubbleColor}
                      onChange={(e) => setSettings({ ...settings, bubbleColor: e.target.value })}
                      className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={settings.bubbleColor}
                      onChange={(e) => setSettings({ ...settings, bubbleColor: e.target.value })}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-primary/50 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                    <Type className="w-3 h-3" /> TYPOGRAPHY_MODE
                  </label>
                  <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                    {["mono", "sans", "serif"].map((font) => (
                      <button
                        key={font}
                        onClick={() => setSettings({ ...settings, fontFamily: font })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                          settings.fontFamily === font
                            ? "bg-primary text-black shadow-lg"
                            : "text-white/40 hover:text-white"
                        )}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                    <Layout className="w-3 h-3" /> DENSITY_GRID
                  </label>
                  <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                    {["compact", "comfortable"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setSettings({ ...settings, density: d })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                          settings.density === d
                            ? "bg-primary text-black shadow-lg"
                            : "text-white/40 hover:text-white"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/40">
                <button
                  onClick={handleSave}
                  className="w-full py-4 rounded-2xl bg-primary text-black text-[10px] font-black tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,242,255,0.2)]"
                >
                  APPLY_CONFIGURATIONS
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
