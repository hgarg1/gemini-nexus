"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Bot, Sparkles, Settings, Play } from "lucide-react";
import { BotBuilder } from "../nexus/bot-builder";
import { BotDetailView } from "../nexus/bot-detail-view";
import { 
  StaggerContainer, 
  StaggerItem, 
  NexusCard, 
  DecodingText, 
  NexusButton, 
  NexusGridBackground 
} from "@/components/ui/nexus-ui";

interface NexusHubViewProps {
  onStartChat: (botId: string) => void;
  filterTag?: string | null;
}

export function NexusHubView({ onStartChat, filterTag }: NexusHubViewProps) {
  const [viewState, setViewState] = useState<"list" | "create" | "edit" | "detail">("list");
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<any[]>([]);

  const fetchBots = async () => {
    try {
      setLoading(true);
      const query = filterTag ? `?tag=${encodeURIComponent(filterTag)}` : "";
      const res = await fetch(`/api/bots${query}`);
      const data = await res.json();
      if (data.bots) setBots(data.bots);
    } catch (e) {
      console.error("Failed to fetch bots", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, [filterTag]);

  const handleSaveBot = (botData: any) => {
    fetchBots();
    setViewState("list");
  };

  if (viewState === "create" || viewState === "edit") {
    const initialData = viewState === "edit" ? bots.find(b => b.id === selectedBotId) : undefined;
    return (
      <BotBuilder 
        initialData={initialData} 
        onSave={handleSaveBot} 
        onCancel={() => setViewState("list")} 
      />
    );
  }

  if (viewState === "detail" && selectedBotId) {
      return (
          <div className="h-full flex flex-col relative overflow-hidden">
              <NexusGridBackground />
              <div className="relative z-10 h-full">
                <BotDetailView 
                    botId={selectedBotId} 
                    onBack={() => setViewState("list")} 
                    onStartChat={onStartChat} 
                />
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <NexusGridBackground />
      
      <div className="flex-1 flex flex-col p-6 space-y-8 overflow-y-auto custom-scrollbar relative z-10">
        <StaggerContainer className="flex justify-between items-end">
          <StaggerItem>
            <h2 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
              <DecodingText text="NEXUS HUB" />
            </h2>
            <p className="text-white/50 text-sm max-w-lg font-mono">
              // ORCHESTRATION LAYER ACTIVE. DEPLOY SPECIALIZED INTELLIGENCE.
            </p>
          </StaggerItem>
          <StaggerItem>
            <NexusButton onClick={() => setViewState("create")} icon={Plus}>
              INITIALIZE AGENT
            </NexusButton>
          </StaggerItem>
        </StaggerContainer>

        <StaggerContainer delay={0.2} className="relative max-w-md">
          <StaggerItem>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="SEARCH_PROTOCOL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] focus:shadow-[0_0_20px_rgba(0,242,255,0.1)]"
            />
          </StaggerItem>
        </StaggerContainer>

        <StaggerContainer delay={0.4} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots
            .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((bot) => (
            <StaggerItem key={bot.id}>
              <NexusCard 
                className="p-6 h-full flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300"
                onClick={() => { setSelectedBotId(bot.id); setViewState("detail"); }}
              >
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                            style={{ 
                                backgroundColor: `${bot.appearance?.themeColor || '#00F2FF'}20`,
                                borderColor: `${bot.appearance?.themeColor || '#00F2FF'}40`
                            }}
                        >
                            <Bot className="w-6 h-6" style={{ color: bot.appearance?.themeColor || '#00F2FF' }} />
                        </div>
                        <button
                        onClick={(e) => { e.stopPropagation(); setSelectedBotId(bot.id); setViewState("edit"); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-colors"
                        >
                        <Settings className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{bot.name}</h3>
                    <p className="text-white/50 text-xs line-clamp-2 mb-4 font-mono leading-relaxed h-10">{bot.description}</p>
                    
                    {/* Tags Preview */}
                    <div className="flex flex-wrap gap-1 mb-4">
                        {bot.tags?.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/40 uppercase tracking-wider">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${bot.status === "PUBLISHED" ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-yellow-500"}`} />
                      <span className="text-[10px] font-bold text-white/40 tracking-wider">{bot.status}</span>
                  </div>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); onStartChat(bot.id); }}
                    className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-bold tracking-wider group"
                  >
                    <Play className="w-3 h-3 group-hover:scale-125 transition-transform" />
                    ENGAGE
                  </button>
                </div>
              </NexusCard>
            </StaggerItem>
          ))}
          
          {/* Create New Placeholder - Glass Tile */}
          <StaggerItem>
            <button
                onClick={() => setViewState("create")}
                className="group w-full h-full flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-xl hover:border-cyan-500/30 hover:bg-cyan-500/[0.02] transition-all min-h-[220px]"
            >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-500/10 transition-all duration-500">
                <Plus className="w-8 h-8 text-white/20 group-hover:text-cyan-400" />
                </div>
                <span className="text-white/30 font-bold tracking-widest text-xs group-hover:text-cyan-400">NEW_CONSTRUCT</span>
            </button>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </div>
  );
}