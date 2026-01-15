"use client";

import React from "react";
import { Compass, Hash, Sparkles, Filter, Star, Search } from "lucide-react";
import { StaggerContainer, StaggerItem, DecodingText } from "@/components/ui/nexus-ui";

interface NexusSidebarContentProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function NexusSidebarContent({ tags, selectedTag, onSelectTag }: NexusSidebarContentProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const categories = ["Productivity", "Creative", "Coding", "Utility", "Roleplay", "Fun"];
  const allTags = Array.from(new Set([...categories, ...tags])).filter(t => 
    t.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 pb-4 border-b border-white/10">
        <Compass className="w-5 h-5 text-cyan-400" />
        <span className="text-sm font-bold tracking-widest text-white">NEXUS_EXPLORER</span>
      </div>

      <StaggerContainer className="space-y-6">
        {/* Search Section */}
        <StaggerItem>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="SEARCH_REGISTRY..." 
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-9 pr-3 text-[10px] text-white font-bold tracking-widest placeholder:text-white/20 outline-none focus:border-cyan-500/30 transition-all uppercase"
                />
            </div>
        </StaggerItem>

        {/* Discovery Section */}
        <StaggerItem className="space-y-2">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Discovery
            </h3>
            <div className="space-y-1">
                <button
                    onClick={() => onSelectTag(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${!selectedTag ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                    Global Registry
                </button>
                <button
                    onClick={() => onSelectTag("Featured")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedTag === "Featured" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                    Featured Agents
                </button>
                <button
                    onClick={() => onSelectTag("TopRated")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedTag === "TopRated" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                    Top Rated
                </button>
            </div>
        </StaggerItem>

        {/* Categories Section */}
        <StaggerItem className="space-y-2">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-3 h-3" />
                Classifications
            </h3>
            <div className="space-y-1">
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => onSelectTag(tag)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${selectedTag === tag ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
                    >
                        <span>{tag}</span>
                        {selectedTag === tag && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />}
                    </button>
                ))}
            </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
