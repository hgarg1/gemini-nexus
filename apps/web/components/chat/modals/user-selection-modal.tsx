"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: any[];
  multiple?: boolean;
  onConfirm: (selectedIds: string[]) => void;
  confirmText?: string;
  onSearch?: (query: string) => void;
}

export function UserSelectionModal({
  isOpen,
  onClose,
  title,
  users,
  multiple = false,
  onConfirm,
  confirmText = "CONFIRM",
  onSearch,
}: UserSelectionModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
    if (multiple) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedIds);
    onClose();
    setSelectedIds([]);
    setSearch("");
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
            <div className="w-full max-w-md glass-panel rounded-[32px] border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="text-sm font-black tracking-widest uppercase text-white">
                  {title}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="SEARCH_OPERATIVES..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white tracking-widest placeholder:text-white/20 outline-none focus:border-primary/50 transition-all uppercase"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredUsers.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelect(user.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all border",
                        isSelected
                          ? "bg-primary/10 border-primary/30"
                          : "border-transparent hover:bg-white/5"
                      )}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                          {user.image ? (
                            <img
                              src={user.image}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-white/20" />
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-black">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <div
                          className={cn(
                            "text-xs font-bold uppercase",
                            isSelected ? "text-primary" : "text-white"
                          )}
                        >
                          {user.name || "UNKNOWN"}
                        </div>
                        <div className="text-[9px] font-mono text-white/30">
                          {user.email}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="py-8 text-center text-[9px] font-black tracking-widest text-white/20 uppercase">
                    NO_AGENTS_FOUND
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5 bg-black/40">
                <button
                  onClick={handleConfirm}
                  disabled={selectedIds.length === 0}
                  className="w-full py-4 rounded-2xl bg-primary text-black text-[10px] font-black tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirmText} ({selectedIds.length})
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
