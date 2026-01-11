"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { AssetsView } from "./views/assets-view";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNewChat: () => void;
  history: any[];
  chatId?: string;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  onStartRename: (id: string, title: string, e: React.MouseEvent) => void;
  editingChatId: string | null;
  editTitle: string;
  onEditTitleChange: (val: string) => void;
  onFinishRename: (id: string) => void;
  profile: { image: string | null; name: string | null };
  onSignOut: () => void;
  onOpenProfile: () => void;
  // Assets Props
  assets: any[];
  assetFilter: { ratio: string; role: string; label: string };
  onAssetFilterChange: (newFilter: { ratio: string; role: string; label: string }) => void;
  availableLabels: string[];
  onToggleLabel: (label: string) => void;
  onOpenViewer: (images: string[], index: number) => void;
  onResetFilters: () => void;
}

export function ChatSidebar({
  isOpen,
  onClose,
  activeTab,
  onNewChat,
  history,
  chatId,
  onDeleteChat,
  onStartRename,
  editingChatId,
  editTitle,
  onEditTitleChange,
  onFinishRename,
  profile,
  onSignOut,
  onOpenProfile,
  assets,
  assetFilter,
  onAssetFilterChange,
  availableLabels,
  onToggleLabel,
  onOpenViewer,
  onResetFilters,
}: ChatSidebarProps) {
  const router = useRouter();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
          />
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="glass-panel border-r border-white/5 flex flex-col min-h-0 overflow-hidden z-30 fixed md:relative inset-y-0 left-0 w-[85vw] max-w-[340px] md:w-[300px] md:max-w-none"
          >
            <div className="p-6 flex items-center justify-between">
              <span className="text-xs font-black tracking-[0.2em] text-white/30 uppercase">
                {activeTab === "assets"
                  ? "VISUAL_ASSETS"
                  : activeTab === "memory"
                    ? "MEMORY_VAULT"
                    : "CONVERSATIONS"}
              </span>
              {activeTab !== "assets" && (
                <button
                  onClick={onNewChat}
                  className="p-2 hover:bg-white/5 rounded-lg text-primary transition-colors active:scale-90"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-8">
              {activeTab === "assets" ? (
                <AssetsView
                  assets={assets}
                  filter={assetFilter}
                  onFilterChange={onAssetFilterChange}
                  availableLabels={availableLabels}
                  onToggleLabel={onToggleLabel}
                  onOpenViewer={onOpenViewer}
                  onResetFilters={onResetFilters}
                />
              ) : (
                <>
                  {history.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => router.push(`/chat/${chat.id}`)}
                      className={cn(
                        "group relative p-4 rounded-2xl transition-all cursor-pointer border border-transparent",
                        chatId === chat.id
                          ? "bg-primary/10 border-primary/20 shadow-lg shadow-primary/5"
                          : "hover:bg-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            chatId === chat.id ? "text-primary" : "text-white/20"
                          )}
                        >
                          LINK_{chat.id.slice(-4)}
                        </span>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => onStartRename(chat.id, chat.title, e)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => onDeleteChat(chat.id, e)}
                            className="p-1 hover:text-accent transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {editingChatId === chat.id ? (
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => onEditTitleChange(e.target.value)}
                          onBlur={() => onFinishRename(chat.id)}
                          onKeyDown={(e) => e.key === "Enter" && onFinishRename(chat.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-black/40 border border-primary/30 rounded px-2 py-1 text-sm w-full outline-none"
                        />
                      ) : (
                        <div
                          className={cn(
                            "text-sm font-bold truncate",
                            chatId === chat.id
                              ? "text-white"
                              : "text-white/60 group-hover:text-primary"
                          )}
                        >
                          {chat.title}
                        </div>
                      )}
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-10 opacity-20">
                      <div className="text-[10px] font-black tracking-widest">NO_ACTIVE_STREAMS</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-6 bg-black/40 border-t border-white/5">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary p-[1px] hover:scale-105 transition-transform"
                    title="Open user settings"
                  >
                    <div className="w-full h-full rounded-xl bg-background flex items-center justify-center overflow-hidden">
                      {profile.image ? (
                        <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </button>
                  <div>
                    <div className="text-sm font-black tracking-tight truncate max-w-[120px]">
                      {profile.name || "ADMIN_USER"}
                    </div>
                    <div className="text-[10px] text-primary font-bold">PREMIUM ACCESS</div>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/20 hover:text-accent transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
