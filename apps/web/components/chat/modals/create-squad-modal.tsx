"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, User, Check, Users, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
  onConfirm: (data: { name: string; memberIds: string[]; settings: any }) => void;
  onSearch?: (query: string) => void;
  allowedSettings?: string[];
}

export function CreateSquadModal({
  isOpen,
  onClose,
  users,
  onConfirm,
  onSearch,
  allowedSettings = ["isPublic", "allowInvites", "description"],
}: CreateSquadModalProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    isPublic: false,
    allowInvites: true,
    description: ""
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (onSearch) onSearch(val);
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 0 && name.trim()) setStep(1);
    else if (step === 1) setStep(2);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleConfirm = () => {
    onConfirm({ name, memberIds: selectedIds, settings });
    onClose();
    // Reset state
    setStep(0);
    setName("");
    setSelectedIds([]);
    setSettings({ isPublic: false, allowInvites: true, description: "" });
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
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-black tracking-widest uppercase text-white">
                    ASSEMBLE_SQUADRON
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {step === 0 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">SQUAD_DESIGNATION</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="E.g. RED_TEAM_ALPHA"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/50 uppercase"
                        autoFocus
                      />
                    </div>
                    {allowedSettings.includes("description") && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">MISSION_BRIEF (OPTIONAL)</label>
                        <textarea
                          value={settings.description}
                          onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                          placeholder="Operational objectives..."
                          className="w-full h-24 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-medium text-white outline-none focus:border-primary/50 uppercase resize-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    {allowedSettings.includes("isPublic") && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">OPERATIONAL_PROTOCOL</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setSettings({ ...settings, isPublic: false })}
                            className={cn(
                              "p-4 rounded-2xl border text-left transition-all",
                              !settings.isPublic ? "bg-primary/10 border-primary/30" : "bg-white/5 border-transparent"
                            )}
                          >
                            <div className="text-xs font-black uppercase text-white">PRIVATE</div>
                            <div className="text-[9px] text-white/40 mt-1">Invite only access</div>
                          </button>
                          <button
                            onClick={() => setSettings({ ...settings, isPublic: true })}
                            className={cn(
                              "p-4 rounded-2xl border text-left transition-all",
                              settings.isPublic ? "bg-primary/10 border-primary/30" : "bg-white/5 border-transparent"
                            )}
                          >
                            <div className="text-xs font-black uppercase text-white">PUBLIC</div>
                            <div className="text-[9px] text-white/40 mt-1">Open to organization</div>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {allowedSettings.includes("allowInvites") && (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div>
                          <div className="text-xs font-black uppercase text-white">ALLOW_INVITES</div>
                          <div className="text-[9px] text-white/40 mt-1">Members can invite others</div>
                        </div>
                        <button 
                          onClick={() => setSettings({ ...settings, allowInvites: !settings.allowInvites })}
                          className={cn(
                            "w-10 h-5 rounded-full relative transition-all",
                            settings.allowInvites ? "bg-primary/20" : "bg-white/10"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            settings.allowInvites ? "left-6 bg-primary" : "left-1 opacity-20"
                          )} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col h-[300px]">
                    <div className="mb-4 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="RECRUIT_OPERATIVES..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-primary/50 uppercase"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                      {filteredUsers.map((user) => {
                        const isSelected = selectedIds.includes(user.id);
                        return (
                          <button
                            key={user.id}
                            onClick={() => handleSelect(user.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded-xl transition-all border",
                              isSelected ? "bg-primary/10 border-primary/30" : "border-transparent hover:bg-white/5"
                            )}
                          >
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                              {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-white/20" />}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <div className={cn("text-xs font-bold uppercase truncate", isSelected ? "text-primary" : "text-white")}>{user.name || "UNKNOWN"}</div>
                              <div className="text-[8px] font-mono text-white/30 truncate">{user.email}</div>
                            </div>
                            {isSelected && <Check className="w-3 h-3 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 text-[10px] font-black tracking-widest text-white/40 uppercase text-center">
                      {selectedIds.length} OPERATIVES SELECTED
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-black/40 flex gap-3">
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 rounded-2xl bg-white/5 text-white text-[10px] font-black tracking-[0.2em] uppercase hover:bg-white/10 transition-all"
                  >
                    BACK
                  </button>
                )}
                <button
                  onClick={step === 2 ? handleConfirm : handleNext}
                  disabled={step === 0 && !name.trim()}
                  className="flex-1 py-3 rounded-2xl bg-primary text-black text-[10px] font-black tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step === 2 ? "INITIALIZE_SQUAD" : "NEXT_PHASE"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
