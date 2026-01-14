"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, User, LogOut, Search, Volume2, Hash, Users, Link as LinkIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { AssetsView } from "./views/assets-view";
import { NexusSidebarContent } from "./nexus/nexus-sidebar-content";
import { MemorySidebarContent } from "./memory/memory-sidebar-content";
import { VersionSidebarContent } from "./version/version-sidebar-content";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  nexusTags?: string[];
  selectedNexusTag?: string | null;
  onSelectNexusTag?: (tag: string | null) => void;
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
  // Collab Props
  channels?: any[];
  groups?: any[];
  directThreads?: any[];
  onSelectThread?: (thread: any) => void;
  onShowLinks?: () => void;
  onCreateSquad?: () => void;
  onCreateDM?: () => void;
  onDeleteThread?: (thread: any) => void;
  onLeaveThread?: (thread: any) => void;
  // Memory Props
  memories?: any[];
  memoryFilter?: string | null;
  onMemoryFilterChange?: (filter: string | null) => void;
  // Version Props
  versionBranches?: any[];
  versionCheckpoints?: any[];
  versionMergeRequests?: any[];
  selectedBranchId?: string | null;
  onSelectBranch?: (id: string | null) => void;
}

export function ChatSidebar({
  isOpen,
  onClose,
  activeTab,
  nexusTags,
  selectedNexusTag,
  onSelectNexusTag,
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
  channels = [],
  groups = [],
  directThreads = [],
  onSelectThread,
  onShowLinks,
  onCreateSquad,
  onCreateDM,
  onDeleteThread,
  onLeaveThread,
  memories = [],
  memoryFilter = null,
  onMemoryFilterChange,
  versionBranches = [],
  versionCheckpoints = [],
  versionMergeRequests = [],
  selectedBranchId = null,
  onSelectBranch,
}: ChatSidebarProps) {
  const router = useRouter();
  const [collabSearch, setCollabSearch] = useState("");

  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(collabSearch.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(collabSearch.toLowerCase()));
  const filteredDirects = directThreads.filter(d => (d.name || "").toLowerCase().includes(collabSearch.toLowerCase()));

  const sidebarTitle = 
    activeTab === "assets" ? "VISUAL_ASSETS" :
    activeTab === "memory" ? "MEMORY_VAULT" :
    activeTab === "version" ? "VERSION_CONTROL" :
    activeTab === "collab" ? "COLLAB_CENTER" :
    activeTab === "grid" ? "NEXUS_HUB" :
    "CONVERSATIONS";

  const showPlusButton = !["assets", "memory", "version", "grid"].includes(activeTab);

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
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { width: 0, opacity: 0 },
              visible: { 
                width: 300, 
                opacity: 1,
                transition: { 
                  duration: 0.3,
                  when: "beforeChildren",
                  staggerChildren: 0.1
                }
              }
            }}
            className="glass-panel border-r border-white/5 flex flex-col min-h-0 overflow-hidden z-30 fixed md:relative inset-y-0 left-0 w-[85vw] max-w-[340px] md:w-[300px] md:max-w-none"
          >
            <div className="p-6 flex items-center justify-between">
              <span className="text-xs font-black tracking-[0.2em] text-white/30 uppercase">
                {sidebarTitle}
              </span>
              {activeTab === "collab" ? (
                 <button onClick={onShowLinks} className="p-2 hover:bg-white/5 rounded-lg text-primary transition-colors active:scale-90" title="Manage Uplinks">
                    <LinkIcon className="w-4 h-4" />
                 </button>
              ) : showPlusButton && (
                <button
                  onClick={onNewChat}
                  className="p-2 hover:bg-white/5 rounded-lg text-primary transition-colors active:scale-90"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="flex-1 overflow-y-auto px-4 space-y-8"
            >
              {activeTab === "collab" ? (
                <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input 
                      value={collabSearch}
                      onChange={(e) => setCollabSearch(e.target.value)}
                      placeholder="FILTER_SIGNALS..." 
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-[10px] text-white font-bold tracking-widest placeholder:text-white/20 outline-none focus:border-primary/30 transition-all uppercase"
                    />
                  </div>
                  {/* ... (Channels, Groups, Directs logic is same, collapsed for brevity in my head but I must write it out) */}
                  <div className="space-y-1">
                    <div className="px-3 text-[9px] font-black text-white/20 tracking-[0.2em] uppercase mb-1">CHANNELS</div>
                    {filteredChannels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => onSelectThread?.(channel)}
                        className="w-full flex items-center gap-3 p-2 px-3 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        {channel.readOnly ? <Volume2 className="w-3.5 h-3.5 text-white/30" /> : <Hash className="w-3.5 h-3.5 text-white/30" />}
                        <span className="text-xs font-bold text-white/60 group-hover:text-white uppercase">{channel.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-3 mb-2 group/header">
                      <span className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase transition-colors group-hover/header:text-white/60">SQUADS</span>
                      <button onClick={onCreateSquad} className="p-1 rounded-md text-white/30 hover:text-primary hover:bg-white/5 transition-all">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {filteredGroups.map((group) => (
                      <div key={group.id} className="group relative">
                        <button
                          onClick={() => onSelectThread?.(group)}
                          className="w-full flex items-center justify-between p-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="w-3.5 h-3.5 text-white/30" />
                            <span className="text-xs font-bold text-white/60 group-hover:text-white uppercase">{group.name}</span>
                          </div>
                          {group.unread > 0 && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </button>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm pl-2 rounded-md">
                           <button onClick={(e) => { e.stopPropagation(); onDeleteThread?.(group); }} className="p-1 hover:text-accent transition-colors"><Trash2 className="w-3 h-3" /></button>
                           <button onClick={(e) => { e.stopPropagation(); onLeaveThread?.(group); }} className="p-1 hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-3 mb-2 group/header">
                      <span className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase transition-colors group-hover/header:text-white/60">DIRECT</span>
                      <button onClick={onCreateDM} className="p-1 rounded-md text-white/30 hover:text-primary hover:bg-white/5 transition-all">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {filteredDirects.map((contact: any) => (
                      <div key={contact.id} className="group relative">
                        <button
                          onClick={() => onSelectThread?.(contact)}
                          className="w-full flex items-center gap-3 p-2 px-3 rounded-lg transition-all border border-transparent hover:bg-white/5"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-white/10 shrink-0">
                            {contact.image ? (
                              <img src={contact.image} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-3 h-3 text-white/40" />
                            )}
                          </div>
                          <div className="text-left overflow-hidden">
                            <div className="text-xs font-bold text-white/60 group-hover:text-white truncate">{contact.name || "UNKNOWN"}</div>
                          </div>
                        </button>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm pl-2 rounded-md">
                           <button onClick={(e) => { e.stopPropagation(); onDeleteThread?.(contact); }} className="p-1 hover:text-accent transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeTab === "grid" ? (
                <NexusSidebarContent 
                    tags={nexusTags || []} 
                    selectedTag={selectedNexusTag || null} 
                    onSelectTag={onSelectNexusTag || (() => {})} 
                />
              ) : activeTab === "assets" ? (
                <AssetsView
                  assets={assets}
                  filter={assetFilter}
                  onFilterChange={onAssetFilterChange}
                  availableLabels={availableLabels}
                  onToggleLabel={onToggleLabel}
                  onOpenViewer={onOpenViewer}
                  onResetFilters={onResetFilters}
                />
              ) : activeTab === "memory" ? (
                <MemorySidebarContent 
                    memories={memories}
                    selectedFilter={memoryFilter}
                    onSelectFilter={onMemoryFilterChange || (() => {})}
                />
              ) : activeTab === "version" ? (
                <VersionSidebarContent
                    branches={versionBranches}
                    checkpoints={versionCheckpoints}
                    mergeRequests={versionMergeRequests}
                    selectedBranchId={selectedBranchId}
                    onSelectBranch={onSelectBranch || (() => {})}
                />
              ) : (
                <>
                  {history.map((chat) => (
                    <motion.div
                      key={chat.id}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
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
                    </motion.div>
                  ))}
                  {history.length === 0 && (
                    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-center py-10 opacity-20">
                      <div className="text-[10px] font-black tracking-widest">NO_ACTIVE_STREAMS</div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
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