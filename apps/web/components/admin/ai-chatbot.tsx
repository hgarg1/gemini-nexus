"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, ShieldAlert, Check, AlertCircle, Terminal, Activity, Plus, History, ChevronLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "model";
  content: string;
  proposal?: {
    type: string;
    data: any;
  };
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

export function AdminAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin/ai/chats");
      const data = await res.json();
      if (data.chats) setSessions(data.chats);
    } catch (err) {
      console.error("Failed to fetch sessions");
    }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("PURGE_SESSION? This action is logged and can only be recovered via Audit Stream.")) return;
    try {
        const res = await fetch(`/api/admin/ai/chats/${id}`, { method: "DELETE" });
        if (res.ok) {
            setSessions(prev => prev.filter(s => s.id !== id));
            if (activeChatId === id) {
                setActiveChatId(null);
                setMessages([]);
            }
        }
    } catch (err) {
        console.error("Deletion failed");
    }
  };

  const loadChat = async (chatId: string) => {
    setIsLoading(true);
    setActiveChatId(chatId);
    setView("chat");
    try {
      // We could have a separate GET /api/admin/ai/chats/[id]
      // or just rely on the first message to populate.
      // For now, we'll clear local messages and let the AI bridge load them if history is empty.
      // Better: let's assume we want to see them immediately.
      // I'll add a quick fetch for messages.
      // Wait, I haven't created GET for messages. I'll just use the bridge with empty prompt to "load"?
      // No, I'll just clear and the next message will include history from DB.
      // Actually, let's just fetch them.
      const res = await fetch(`/api/admin/ai/chat/${chatId}`); // Need to create this
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          proposal: m.proposal
        })));
      }
    } catch (err) {
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setView("chat");
  };

  const handleSend = async (overridePrompt?: string, confirmedAction?: any) => {
    const promptValue = overridePrompt || input;
    if (!promptValue.trim() && !confirmedAction) return;

    if (!confirmedAction) {
      setMessages(prev => [...prev, { role: "user", content: promptValue }]);
      setInput("");
    }
    
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: promptValue,
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
          confirmedAction,
          chatId: activeChatId
        }),
      });

      const data = await res.json();
      if (data.message) {
        if (data.chatId && !activeChatId) setActiveChatId(data.chatId);
        setMessages(prev => [...prev, { 
          role: "model", 
          content: data.message,
          proposal: data.proposal
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "model", content: "CRITICAL_ERROR: Neural uplink severed." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeProposal = async (proposal: any) => {
    await handleSend("", proposal);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-mono">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[400px] h-[600px] glass-panel rounded-[32px] border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary animate-pulse">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-[0.3em] text-primary/60">NEXUS_CORE_AI</div>
                  <div className="text-[8px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                    <Activity className="w-2 h-2" /> ONLINE
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setView(view === "chat" ? "history" : "chat")}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/40 transition-colors"
                  title="Session History"
                >
                  <History className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {view === "history" ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-black tracking-widest text-white/20 uppercase">ARCHIVED_SESSIONS</div>
                  <button 
                    onClick={startNewChat}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all"
                  >
                    <Plus className="w-3 h-3" /> NEW_LINK
                  </button>
                </div>
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadChat(s.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1 relative group/card",
                      activeChatId === s.id ? "bg-primary/5 border-primary/30" : "bg-white/5 border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="text-sm font-bold text-white truncate pr-8">{s.title}</div>
                    <div className="text-[9px] text-white/20 uppercase font-mono">{new Date(s.updatedAt).toLocaleString()}</div>
                    
                    <button 
                        onClick={(e) => deleteChat(s.id, e)}
                        className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 text-white/20 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))}
                {sessions.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                    <History className="w-8 h-8 mb-4" />
                    <div className="text-[10px] font-black tracking-widest uppercase">No sessions recorded.</div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 px-8">
                      <Terminal className="w-12 h-12 mb-4" />
                      <div className="text-[10px] font-black tracking-widest uppercase">Awaiting administrative command...</div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.role === "user" ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex flex-col gap-2 max-w-[85%]",
                        m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed",
                        m.role === "user" 
                          ? "bg-primary/10 border border-primary/20 text-primary rounded-tr-none" 
                          : "bg-white/5 border border-white/10 text-white/80 rounded-tl-none"
                      )}>
                        {m.content}
                      </div>

                      {m.proposal && (
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full mt-2 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-4 shadow-[0_10px_40px_rgba(239,68,68,0.15)]"
                        >
                          <div className="flex items-center gap-3 text-red-500">
                            <ShieldAlert className="w-5 h-5" />
                            <span className="text-[10px] font-black tracking-widest uppercase">AUTHORIZATION_REQUIRED</span>
                          </div>
                          <div className="text-xs font-bold text-white/60">
                            ACTION: <span className="text-red-400">{m.proposal.type.toUpperCase()}</span>
                            <div className="mt-1 opacity-50 font-mono text-[9px]">
                              TARGET_ID: {m.proposal.data.userId}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button 
                              onClick={() => executeProposal(m.proposal)}
                              className="px-4 py-2.5 rounded-xl bg-red-500 text-black text-[9px] font-black tracking-widest uppercase hover:scale-105 transition-all flex items-center justify-center gap-2"
                            >
                              <Check className="w-3 h-3" /> AUTHORIZE
                            </button>
                            <button 
                              onClick={() => setMessages(prev => [...prev, { role: "model", content: "Protocol aborted by administrator." }])}
                              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[9px] font-black tracking-widest uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                              <X className="w-3 h-3" /> ABORT
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-primary/40 text-[10px] font-black tracking-widest animate-pulse">
                      <Activity className="w-3 h-3" /> ANALYZING_SYSTEM_STATE...
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-6 bg-black/40 border-t border-white/5">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex items-center bg-black border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-colors">
                      <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="ENTER COMMAND..."
                        className="w-full bg-transparent p-4 text-xs font-mono text-primary placeholder:text-white/10 outline-none"
                      />
                      <button 
                        onClick={() => handleSend()}
                        className="p-4 text-primary/40 hover:text-primary transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 group",
          isOpen ? "bg-white/5 border border-white/10 text-white" : "bg-primary text-black border-4 border-black ring-1 ring-primary/50"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-8 h-8" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot className="w-8 h-8" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isOpen && (
          <div className="absolute inset-0 rounded-3xl bg-primary blur-2xl opacity-40 group-hover:opacity-60 transition-opacity -z-10" />
        )}
      </motion.button>
    </div>
  );
}