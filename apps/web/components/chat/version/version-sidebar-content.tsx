"use client";

import React from "react";
import { GitBranch, GitCommit, GitMerge, ListFilter } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/nexus-ui";

interface VersionSidebarContentProps {
  branches: any[];
  checkpoints: any[];
  mergeRequests: any[];
  selectedBranchId: string | null;
  onSelectBranch: (id: string | null) => void;
}

export function VersionSidebarContent({ 
  branches, 
  checkpoints, 
  mergeRequests, 
  selectedBranchId, 
  onSelectBranch 
}: VersionSidebarContentProps) {
  return (
    <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 pb-4 border-b border-white/10">
        <GitBranch className="w-5 h-5 text-secondary" />
        <span className="text-sm font-bold tracking-widest text-white">VAULT_VERSIONING</span>
      </div>

      <StaggerContainer className="space-y-6">
        <StaggerItem className="space-y-2">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                <ListFilter className="w-3 h-3" />
                Active Branches
            </h3>
            <div className="space-y-1">
                {branches.map(branch => (
                    <button
                        key={branch.id}
                        onClick={() => onSelectBranch(branch.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-between ${selectedBranchId === branch.id ? "bg-secondary/20 text-secondary border border-secondary/30" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                    >
                        <span>{branch.name}</span>
                        {branch.name === "master" && <GitCommit className="w-3 h-3 opacity-50" />}
                    </button>
                ))}
            </div>
        </StaggerItem>

        <StaggerItem className="space-y-4">
             <div className="glass-panel p-4 rounded-xl border-white/5 bg-white/5 space-y-3">
                 <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Checkpoints</span>
                     <span className="text-xs font-bold text-secondary">{checkpoints.length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Merge Reqs</span>
                     <span className="text-xs font-bold text-primary">{mergeRequests.length}</span>
                 </div>
             </div>
             
             <div className="text-[9px] text-white/20 px-2 leading-relaxed uppercase font-black">
                 Select a branch to view detailed commit history and establish merge pipelines.
             </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
