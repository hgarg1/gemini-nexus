"use client";

import React from "react";
import { GitBranch, GitCommit, GitMerge, ListFilter, Activity, GitPullRequest } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/nexus-ui";

interface VersionSidebarContentProps {
  branches: any[];
  checkpoints: any[];
  mergeRequests: any[];
  selectedBranchId: string | null;
  onSelectBranch: (id: string | null) => void;
  onSelectCheckpoint?: (id: string) => void;
  onSelectMergeRequest?: (id: string) => void;
}

export function VersionSidebarContent({ 
  branches, 
  checkpoints, 
  mergeRequests, 
  selectedBranchId, 
  onSelectBranch,
  onSelectCheckpoint,
  onSelectMergeRequest
}: VersionSidebarContentProps) {
  
  const recentCheckpoints = [...checkpoints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const openPRs = mergeRequests.filter(mr => mr.status === "open");

  return (
    <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 pb-4 border-b border-white/10">
        <GitBranch className="w-5 h-5 text-secondary" />
        <span className="text-sm font-bold tracking-widest text-white">VAULT_VERSIONING</span>
      </div>

      <StaggerContainer className="space-y-6">
        {/* Branches */}
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
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-between group ${selectedBranchId === branch.id ? "bg-secondary/20 text-secondary border border-secondary/30" : "text-white/40 hover:text-white hover:bg-white/5 hover:translate-x-1"}`}
                    >
                        <span>{branch.name}</span>
                        {branch.name === "master" && <GitCommit className="w-3 h-3 opacity-50" />}
                    </button>
                ))}
            </div>
        </StaggerItem>

        {/* PRs */}
        <StaggerItem className="space-y-2">
             <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                <GitPullRequest className="w-3 h-3" />
                Open Requests
            </h3>
            <div className="space-y-1">
                {openPRs.length > 0 ? openPRs.map(pr => (
                    <button 
                        key={pr.id} 
                        onClick={() => onSelectMergeRequest?.(pr.id)}
                        className="w-full text-left p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 hover:translate-x-1 transition-all group"
                    >
                        <div className="text-[10px] font-bold text-white/80 truncate group-hover:text-white">{pr.title}</div>
                        <div className="text-[9px] text-white/40 flex items-center gap-1 mt-1 group-hover:text-white/60">
                            <span>{pr.sourceBranch?.name}</span>
                            <span className="text-secondary">→</span>
                            <span>{pr.targetBranch?.name}</span>
                        </div>
                    </button>
                )) : (
                    <div className="text-[10px] text-white/20 italic px-2">No active merge requests.</div>
                )}
            </div>
        </StaggerItem>

        {/* Recent Activity */}
        <StaggerItem className="space-y-2">
             <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Recent Nodes
            </h3>
            <div className="space-y-2 relative">
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/10" />
                {recentCheckpoints.map((cp) => (
                    <button 
                        key={cp.id} 
                        onClick={() => onSelectCheckpoint?.(cp.id)}
                        className="relative pl-4 w-full text-left group hover:translate-x-1 transition-transform"
                    >
                        <div className="absolute left-[3px] top-2 w-1.5 h-1.5 rounded-full bg-secondary/50 group-hover:bg-secondary group-hover:shadow-[0_0_8px_#a855f7] transition-all" />
                        <div className="text-[10px] font-bold text-white/70 truncate group-hover:text-white transition-colors">{cp.label}</div>
                        <div className="text-[9px] text-white/30 group-hover:text-white/50">{new Date(cp.createdAt).toLocaleDateString()}</div>
                    </button>
                ))}
                 {recentCheckpoints.length === 0 && (
                    <div className="text-[10px] text-white/20 italic px-2">Vault is empty.</div>
                )}
            </div>
        </StaggerItem>

        <StaggerItem className="glass-panel p-4 rounded-xl border-white/5 bg-white/5 space-y-3">
             <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Checkpoints</span>
                 <span className="text-xs font-bold text-secondary">{checkpoints.length}</span>
             </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
