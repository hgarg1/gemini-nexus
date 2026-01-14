"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link as LinkIcon,
  Users,
  MessageSquare,
  Search,
  Copy,
  ExternalLink,
  ShieldCheck,
  Send,
  User,
  Settings2,
  Hash,
  Volume2,
  Edit3,
  Check,
  X,
  UserX,
  Trash2,
  Plus,
  RefreshCw,
  Shield,
  FilePlus,
  X as CloseIcon,
  FileText,
  SmilePlus
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ChatOrgOverride, ChatPolicy } from "@/lib/chat-policy";

type CollabViewTab = "chats" | "links";

interface CollaborationViewProps {
  chatId?: string;
  baseUrl: string;
  policy: ChatPolicy;
  orgOverride: ChatOrgOverride;
  activeTab: any; 
  onTabChange: (tab: any) => void;
  
  // Data props (reused where applicable)
  links: any[];
  linksLoading: boolean;
  onToggleLink: (linkId: string, active: boolean) => void;
  onDeleteLink: (linkId: string) => void;
  
  // User/Chat props
  owner: any | null;
  participants: any[];
  isOwner: boolean;
  
  // Directory/Messaging props
  directoryUsers: any[];
  directThreadUser: any | null;
  directMessages: any[];
  directDraft: string;
  onDirectDraftChange: (val: string) => void;
  onOpenThread: (user: any) => void;
  onSendDirectMessage: (files?: string[]) => void;
  onReact?: (messageId: string, emoji: string) => void;
  appearance?: any;
  onSaveAppearance?: (settings: any) => void;
  
  // Notification props (No longer used here, moved to admin)
  notificationSettings: {
    dmToast: boolean;
    chatToast: boolean;
    emailNotifications: boolean;
  };
  onUpdateNotifications: (next: Partial<CollaborationViewProps["notificationSettings"]>) => void;
  
  memberships: any[];
  activeOrgId: string | null;
  onOrgChange: (orgId: string | null) => void;
}

import { ChatAppearanceModal } from "../modals/chat-appearance-modal";

export function CollaborationView({
  baseUrl,
  policy,
  links,
  linksLoading,
  onToggleLink,
  onDeleteLink,
  directThreadUser,
  directMessages,
  directDraft,
  onDirectDraftChange,
  onOpenThread,
  onSendDirectMessage,
  onReact,
  directoryUsers,
  appearance,
  onSaveAppearance,
}: CollaborationViewProps) {
  const [internalTab, setInternalTab] = useState<CollabViewTab>("chats");
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);

  const handleSaveAppearance = async (settings: any) => {
    if (onSaveAppearance) {
      await onSaveAppearance(settings);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background font-mono overflow-hidden">
      <ChatAppearanceModal
        isOpen={isAppearanceModalOpen}
        onClose={() => setIsAppearanceModalOpen(false)}
        initialSettings={appearance}
        onSave={handleSaveAppearance}
      />
      {/* Header / Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-panel/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase text-white">COLLAB_NEXUS</h1>
            <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-white/30 uppercase">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              ONLINE
            </div>
          </div>
        </div>
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
          <NavButton 
            active={internalTab === "chats"} 
            onClick={() => setInternalTab("chats")} 
            icon={<MessageSquare className="w-3.5 h-3.5" />} 
            label="COMMS" 
          />
          <NavButton 
            active={internalTab === "links"} 
            onClick={() => setInternalTab("links")} 
            icon={<LinkIcon className="w-3.5 h-3.5" />} 
            label="UPLINKS" 
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {internalTab === "chats" && (
            <motion.div 
              key="chats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0"
            >
              <ChatsView 
                activeUser={directThreadUser}
                messages={directMessages}
                draft={directDraft}
                onDraftChange={onDirectDraftChange}
                onSend={(files?: string[]) => onSendDirectMessage(files)}
                contacts={directoryUsers} 
                onSelectContact={onOpenThread}
                onOpenAppearance={() => setIsAppearanceModalOpen(true)}
                appearance={appearance}
                onReact={onReact}
              />
            </motion.div>
          )}

          {internalTab === "links" && (
            <motion.div 
              key="links"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 overflow-y-auto p-6 md:p-10"
            >
              <LinksManager 
                links={links}
                loading={linksLoading}
                onToggle={onToggleLink}
                onDelete={onDeleteLink}
                baseUrl={baseUrl}
                policy={policy}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-[10px] font-black tracking-[0.2em] uppercase",
        active 
          ? "bg-primary text-black shadow-lg shadow-primary/20" 
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function ChatsView({ activeUser, messages, draft, onDraftChange, onSend, contacts, onSelectContact, onOpenAppearance, appearance, onReact }: any) {
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const themeStyle = useMemo(() => {
    if (!appearance) return {};
    return {
      "--primary": appearance.bubbleColor || "#00f2ff",
      "--font-family": appearance.fontFamily === "mono" ? "ui-monospace, monospace" : appearance.fontFamily === "serif" ? "serif" : "ui-sans-serif, sans-serif",
    };
  }, [appearance]);

  const handleEmojiClick = async (messageId: string, emoji: string) => {
    onReact?.(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const commonEmojis = ["👍", "🔥", "😂", "😮", "😢", "😡"];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Simple preview generation for images
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const clearFiles = () => {
    setFilePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = () => {
    onSend(filePreviews); 
    clearFiles();
  };

  const handleBlockUser = async () => {
    if (!activeUser?.id) return;
    try {
        const res = await fetch("/api/collaboration/block", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId: activeUser.id })
        });
        const data = await res.json();
        if (res.ok) {
            alert("USER_BLOCKED_SUCCESSFULLY");
        } else {
            alert(`BLOCK_FAILED: ${data.error}`);
        }
    } catch (err) {
        console.error("Block failed", err);
    }
  };

  return (
    <div className="flex h-full" style={themeStyle as any}>
      {/* Active Chat */}
      <div className={cn(
        "flex-1 flex flex-col relative transition-all duration-500",
        appearance?.theme === "void" ? "bg-black" : 
        appearance?.theme === "organic" ? "bg-[#05100a]" :
        appearance?.theme === "minimal" ? "bg-white/[0.02]" :
        "bg-black/40"
      )}>
        {activeUser ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--primary,#00f2ff)] shadow-[0_0_10px_var(--primary,#00f2ff)]" />
                <span className="text-sm font-black tracking-wider uppercase" style={{ fontFamily: "var(--font-family)" }}>{activeUser.name}</span>
              </div>
              <div className="flex gap-2">
                <button 
                    onClick={onOpenAppearance}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-[var(--primary,#00f2ff)] transition-all"
                    title="Customize Appearance"
                >
                    <Settings2 className="w-4 h-4" />
                </button>
                <button 
                    onClick={handleBlockUser}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-all"
                    title="Block User"
                >
                    <UserX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className={cn(
                "flex-1 overflow-y-auto p-6 space-y-6",
                appearance?.density === "compact" ? "space-y-2" : "space-y-6"
            )}>
              {(messages || []).map((msg: any) => {
                if (!msg || !activeUser) return null;
                const isMe = msg.senderId !== activeUser.id; 
                
                // Group reactions by emoji
                const reactionGroups = (msg.reactions || []).reduce((acc: any, r: any) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {});

                return (
                  <div key={msg.id || Math.random().toString()} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className={cn("flex group/msg", isMe ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn(
                        "max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed border space-y-2 transition-all duration-500 relative",
                        isMe 
                          ? "bg-[var(--primary-glow,rgba(0,242,255,0.1))] border-[var(--primary,#00f2ff)]/20 text-[var(--primary,#00f2ff)] rounded-tr-sm shadow-[0_0_20px_rgba(0,0,0,0.2)]" 
                          : "bg-white/5 border-white/10 text-white/80 rounded-tl-sm"
                      )}
                      style={{ 
                          fontFamily: "var(--font-family)",
                          backgroundColor: isMe ? `${appearance?.bubbleColor}15` : undefined,
                          borderColor: isMe ? `${appearance?.bubbleColor}30` : undefined,
                          color: isMe ? appearance?.bubbleColor : undefined
                      }}>
                        {/* Render Assets */}
                        {msg.assets && msg.assets.length > 0 && (
                          <div className={cn("grid gap-2 mb-2", msg.assets.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                            {msg.assets.map((asset: any) => (
                              <div key={asset.id} className="relative group/asset rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                <img src={asset.url} className="w-full h-auto object-cover max-h-60" alt="Transmission Fragment" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/asset:opacity-100 transition-opacity flex items-center justify-center">
                                  <button onClick={() => window.open(asset.url, '_blank')} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                                    <ExternalLink className="w-4 h-4 text-white" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                        
                        <div className={cn("text-[9px] font-mono mt-2 opacity-40 uppercase flex items-center gap-2", isMe ? "justify-end" : "justify-start")}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : "SENDING..."}
                        </div>

                        {/* Reaction Trigger (Hover) */}
                        <div className={cn(
                          "absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-all duration-300 z-20",
                          isMe ? "right-full mr-2" : "left-full ml-2"
                        )}>
                          <button 
                            onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                            className="p-2 rounded-full bg-panel border border-white/10 hover:border-primary/50 text-white/40 hover:text-primary backdrop-blur-xl shadow-2xl"
                          >
                            <SmilePlus className="w-4 h-4" />
                          </button>
                          
                          <AnimatePresence>
                            {showEmojiPicker === msg.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-1.5 rounded-2xl bg-panel border border-white/10 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-1"
                              >
                                {commonEmojis.map(emoji => (
                                  <button 
                                    key={emoji} 
                                    onClick={() => handleEmojiClick(msg.id, emoji)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all hover:scale-125"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Rendered Reactions */}
                    {Object.keys(reactionGroups).length > 0 && (
                      <div className={cn("flex flex-wrap gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
                        {Object.entries(reactionGroups).map(([emoji, count]: any) => (
                          <button 
                            key={emoji}
                            onClick={() => handleEmojiClick(msg.id, emoji)}
                            className="px-2 py-1 rounded-full bg-white/5 border border-white/5 hover:border-primary/30 text-[10px] flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-90"
                          >
                            <span>{emoji}</span>
                            <span className="font-bold opacity-60">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-black/40 space-y-3">
              {filePreviews.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {filePreviews.map((preview, i) => (
                    <div key={i} className="relative group">
                      <img src={preview} className="h-16 w-16 object-cover rounded-xl border border-white/10" />
                      <button onClick={() => setFilePreviews(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 pr-2 transition-all focus-within:border-[var(--primary,#00f2ff)]/40">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl text-white/40 hover:text-[var(--primary,#00f2ff)] hover:bg-white/5 transition-all">
                  <FilePlus className="w-5 h-5" />
                </button>
                <textarea 
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder={`TRANSMIT TO ${activeUser.name}...`}
                  className="flex-1 bg-transparent px-2 py-2 text-sm font-medium text-white placeholder:text-white/20 outline-none resize-none max-h-32"
                  rows={1}
                  style={{ fontFamily: "var(--font-family)" }}
                />
                <button 
                  onClick={handleSend}
                  disabled={!draft.trim() && filePreviews.length === 0}
                  className="p-3 rounded-xl bg-[var(--primary,#00f2ff)] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_var(--primary,#00f2ff)]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <MessageSquare className="w-16 h-16 mb-6 opacity-20" />
            <div className="text-xs font-black tracking-[0.3em] uppercase">NO_SIGNAL_LOCKED</div>
            <p className="text-[10px] mt-2 opacity-50">Select a frequency to begin transmission</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LinksManager({ links, loading, onToggle, onDelete, baseUrl, policy }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const startEdit = (link: any) => {
    setEditingId(link.id);
    setEditLabel(link.label || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
  };

  const saveEdit = async (linkId: string) => {
    // In a real app, this would call an update API
    console.log(`Updating link ${linkId} with label: ${editLabel}`);
    // Optimistic update or refetch would go here
    setEditingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">UPLINK_MANAGEMENT</h2>
          <p className="text-xs text-white/40 font-bold tracking-[0.2em] mt-1 uppercase">Monitor and control chat access points</p>
        </div>
        <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[9px] font-black tracking-[0.2em] text-white/60">
          {links.length} / {policy.maxLinks} ACTIVE_NODES
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-[10px] font-black tracking-[0.3em] text-white/20 animate-pulse">SYNCING_NETWORK_TOPOLOGY...</div>
        ) : links.length === 0 ? (
          <div className="text-center py-10 text-[10px] font-black tracking-[0.3em] text-white/20">NO_ACTIVE_UPLINKS_DETECTED</div>
        ) : (
          links.map((link: any) => (
            <div key={link.id} className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-4 flex-1">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", link.active ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500")}>
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {editingId === link.id ? (
                        <div className="flex items-center gap-2">
                            <input 
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="bg-black/40 border border-primary/30 rounded px-2 py-1 text-xs text-white outline-none uppercase font-bold"
                                autoFocus
                            />
                            <button onClick={() => saveEdit(link.id)} className="p-1 hover:text-green-500"><Check className="w-3 h-3" /></button>
                            <button onClick={cancelEdit} className="p-1 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                    ) : (
                        <>
                            <span className="text-xs font-black uppercase text-white">{link.label || "UNLABELED_NODE"}</span>
                            <button onClick={() => startEdit(link)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/30 hover:text-white">
                                <Edit3 className="w-3 h-3" />
                            </button>
                        </>
                    )}
                    <span className="text-[9px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded uppercase">{link.useCount} USES</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[10px] text-primary/60">{baseUrl}/join/{link.code}</code>
                    <button onClick={() => navigator.clipboard.writeText(`${baseUrl}/join/${link.code}`)} className="p-1 hover:text-white text-white/20 transition-colors"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => onToggle(link.id, link.active)} className={cn("p-2 rounded-lg transition-all", link.active ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-white/5 text-white/40 hover:text-white")} title={link.active ? "Disable" : "Enable"}>
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(link.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all" title="Destroy">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}