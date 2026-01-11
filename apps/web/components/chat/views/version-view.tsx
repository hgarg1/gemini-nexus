"use client";

import React from "react";
import { motion } from "framer-motion";
import { NeonSelect } from "../ui/neon-select";
import { cn } from "../../../lib/utils";

interface VersionViewProps {
  loading: boolean;
  branches: any[];
  checkpoints: any[];
  mergeRequests: any[];
  selectedBranchId: string | null;
  onSelectBranch: (id: string | null) => void;
  selectedCheckpointId: string | null;
  onSelectCheckpoint: (id: string | null) => void;
  selectedMergeRequestId: string | null;
  onSelectMergeRequest: (id: string | null) => void;
  isCompiling: boolean;
  onCompile: (branchId: string) => void;
  onOpenBranchModal: () => void;
  onOpenCheckpointModal: (mode: "create" | "edit", checkpoint?: any) => void;
  onOpenMergeModal: (sourceId: string | null, targetId: string | null) => void;
  onOpenMergeConfirm: (request: any) => void;
  onRestoreCheckpoint: (checkpointId: string) => void;
  checkpointCommentDraft: string;
  onCheckpointCommentChange: (val: string) => void;
  onSaveCheckpointComment: () => void;
  mergeCommentDraft: string;
  onMergeCommentChange: (val: string) => void;
  onSaveMergeComment: () => void;
  currentModelName: string;
}

export function VersionView({
  loading,
  branches,
  checkpoints,
  mergeRequests,
  selectedBranchId,
  onSelectBranch,
  selectedCheckpointId,
  onSelectCheckpoint,
  selectedMergeRequestId,
  onSelectMergeRequest,
  isCompiling,
  onCompile,
  onOpenBranchModal,
  onOpenCheckpointModal,
  onOpenMergeModal,
  onOpenMergeConfirm,
  onRestoreCheckpoint,
  checkpointCommentDraft,
  onCheckpointCommentChange,
  onSaveCheckpointComment,
  mergeCommentDraft,
  onMergeCommentChange,
  onSaveMergeComment,
  currentModelName,
}: VersionViewProps) {
  const branchOptions = branches.length
    ? branches.map((branch: any) => ({
        label: branch.name.toUpperCase(),
        value: branch.id,
      }))
    : [{ label: "NO_BRANCH", value: "" }];

  const selectedBranch = branches.find((branch: any) => branch.id === selectedBranchId) || branches[0];
  const checkpointById = new Map(checkpoints.map((checkpoint: any) => [checkpoint.id, checkpoint]));
  const selectedCheckpoint = selectedCheckpointId ? checkpointById.get(selectedCheckpointId) : null;
  const selectedMergeRequest = selectedMergeRequestId
    ? mergeRequests.find((item: any) => item.id === selectedMergeRequestId)
    : null;
  const mergeRequestsOpen = mergeRequests.filter((mergeRequest: any) => mergeRequest.status === "open");

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10"
    >
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] text-secondary/60 uppercase">VERSION_VAULT</div>
            <h2 className="text-3xl font-black tracking-tighter">BRANCH_TREE_MATRIX</h2>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mt-2">
              Checkpoints evolve in lanes. Merge only with intent.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenBranchModal}
              className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] uppercase hover:bg-white/10 transition-all"
            >
              NEW_BRANCH
            </button>
            <button
              onClick={() => onOpenCheckpointModal("create")}
              className="px-4 py-3 rounded-2xl bg-primary text-black text-[10px] font-black tracking-[0.3em] uppercase hover:scale-105 transition-all"
            >
              CHECKPOINT
            </button>
            <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-[10px] font-black tracking-[0.3em] uppercase text-white/50">
              MODEL_{currentModelName.split(" ").slice(0, 3).join("_").toUpperCase()}
            </div>
            <button
              onClick={() => onCompile(selectedBranch?.id || selectedBranchId)}
              disabled={isCompiling || !selectedBranch?.id}
              className={cn(
                "px-4 py-3 rounded-2xl border text-[10px] font-black tracking-[0.3em] uppercase transition-all",
                isCompiling
                  ? "border-white/10 text-white/30"
                  : "border-primary/30 text-primary hover:border-primary/60 hover:text-white"
              )}
            >
              {isCompiling ? "COMPILING..." : "COMPILE"}
            </button>
            <button
              onClick={() => {
                const targetId = branches.find((branch: any) => branch.id !== selectedBranchId)?.id || null;
                onOpenMergeModal(selectedBranchId, targetId);
              }}
              className="px-4 py-3 rounded-2xl bg-secondary/20 text-secondary border border-secondary/30 text-[10px] font-black tracking-[0.3em] uppercase hover:bg-secondary/30 transition-all"
            >
              OPEN_PR
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_0.8fr] gap-8">
          <div className="glass-panel rounded-[32px] border-white/10 p-6 space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 left-10 h-40 w-40 rounded-full bg-primary/20 blur-[90px]" />
              <div className="absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-secondary/20 blur-[90px]" />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">ACTIVE_BRANCH</div>
                <div className="text-xl font-black tracking-tight text-primary mt-1">
                  {selectedBranch?.name?.toUpperCase() || "NO_BRANCH"}
                </div>
              </div>
              <div className="min-w-[220px]">
                <NeonSelect
                  label="BRANCH_SELECT"
                  tone="secondary"
                  value={selectedBranchId || ""}
                  options={branchOptions}
                  onChange={(value) => onSelectBranch(value || null)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
                SYNCHRONIZING_BRANCHES...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative overflow-x-auto">
                  <div className="min-w-[640px] grid gap-6">
                    {branches.map((branch: any) => {
                      const nodes = checkpoints
                        .filter((checkpoint: any) => checkpoint.branchId === branch.id)
                        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                      const headId = branch.headId;
                      return (
                        <div key={branch.id} className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full shadow-[0_0_10px_currentcolor]",
                                branch.id === selectedBranchId ? "bg-primary text-primary" : "bg-white/30 text-white/30"
                              )}
                            />
                            <div className="text-xs font-black tracking-[0.2em] uppercase text-white/70">
                              {branch.name}
                            </div>
                            {headId && (
                              <div className="text-[9px] font-black tracking-[0.3em] text-white/20 uppercase">HEAD</div>
                            )}
                          </div>
                          <div className="relative flex gap-6 overflow-x-auto pb-4">
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
                            {nodes.map((node: any, index: number) => (
                              <button
                                key={node.id}
                                onClick={() => onSelectCheckpoint(node.id)}
                                className={cn(
                                  "relative z-10 min-w-[180px] rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
                                  node.id === headId
                                    ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(0,242,255,0.25)]"
                                    : "border-white/10 bg-black/50 hover:border-white/30"
                                )}
                              >
                                <div className="text-[9px] font-black tracking-[0.3em] uppercase text-white/30">
                                  NODE_{index + 1}
                                </div>
                                <div className="text-xs font-black tracking-tight text-white mt-2 line-clamp-2">
                                  {node.label}
                                </div>
                                <div className="text-[9px] font-bold text-white/40 mt-2 uppercase">
                                  {new Date(node.createdAt).toLocaleDateString()}
                                </div>
                              </button>
                            ))}
                            {nodes.length === 0 && (
                              <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
                                NO_CHECKPOINTS
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="rounded-[24px] border border-white/10 bg-black/50 p-5 space-y-3">
                    <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">CHECKPOINTS</div>
                    <div className="text-2xl font-black tracking-tight text-primary">{checkpoints.length}</div>
                    <div className="text-[9px] font-bold text-white/30 uppercase">Nodes across all branches</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/50 p-5 space-y-3">
                    <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">OPEN_PR</div>
                    <div className="text-2xl font-black tracking-tight text-secondary">{mergeRequestsOpen.length}</div>
                    <div className="text-[9px] font-bold text-white/30 uppercase">Merge requests awaiting action</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/50 p-5 space-y-3">
                    <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">ACTIVE_MODEL</div>
                    <div className="text-sm font-black tracking-tight text-white">
                      {currentModelName.toUpperCase()}
                    </div>
                    <div className="text-[9px] font-bold text-white/30 uppercase">Applies to new checkpoints</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/50 p-5 space-y-3">
                    <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">LAST_COMPILE</div>
                    <div className="text-2xl font-black tracking-tight text-accent">
                      {selectedBranch?.lastCompiledAt ? "SYNCED" : "PENDING"}
                    </div>
                    <div className="text-[9px] font-bold text-white/30 uppercase">
                      {selectedBranch?.lastCompiledAt
                        ? new Date(selectedBranch.lastCompiledAt).toLocaleDateString()
                        : "Compile to materialize state"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-[28px] border-white/10 p-6 space-y-4">
              <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">NODE_DETAILS</div>
              {selectedCheckpoint ? (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs font-black tracking-[0.2em] uppercase text-primary/80">LABEL</div>
                    <div className="text-lg font-black tracking-tight text-white">{selectedCheckpoint.label}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black tracking-[0.2em] uppercase text-white/30">SUMMARY</div>
                    <div className="text-sm text-white/70 leading-relaxed">
                      {selectedCheckpoint.comment || "No comment stored."}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <button
                      onClick={() => onOpenCheckpointModal("edit", selectedCheckpoint)}
                      className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] uppercase hover:border-primary/40 transition-all"
                    >
                      EDIT_NODE
                    </button>
                    <button
                      onClick={() => onRestoreCheckpoint(selectedCheckpoint.id)}
                      className="px-4 py-3 rounded-2xl bg-secondary/20 border border-secondary/30 text-secondary text-[10px] font-black tracking-[0.3em] uppercase hover:bg-secondary/30 transition-all"
                    >
                      RESTORE
                    </button>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                    <div className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">COMMENTS</div>
                    {(selectedCheckpoint.comments || []).length === 0 ? (
                      <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
                        NO_COMMENTS
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                        {(selectedCheckpoint.comments || []).map((comment: any, idx: number) => (
                          <div key={comment.id} className="rounded-xl border border-white/10 bg-black/50 p-3">
                            <div className="text-[9px] font-black tracking-[0.3em] text-white/20 uppercase">
                              NOTE_{idx + 1}
                            </div>
                            <div className="text-xs text-white/70 mt-2">{comment.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        value={checkpointCommentDraft}
                        onChange={(e) => onCheckpointCommentChange(e.target.value)}
                        placeholder="ADD COMMENT..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black tracking-[0.2em] uppercase outline-none focus:border-primary/40"
                      />
                      <button
                        onClick={onSaveCheckpointComment}
                        className="px-3 py-2 rounded-xl bg-primary text-black text-[9px] font-black tracking-[0.3em] uppercase hover:scale-105 transition-all"
                      >
                        SAVE
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
                  SELECT_NODE_TO_INSPECT
                </div>
              )}
            </div>
            <div className="glass-panel rounded-[28px] border-white/10 p-6 space-y-4">
              <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">PULL_REQUEST_DETAIL</div>
              {selectedMergeRequest ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-black tracking-[0.2em] uppercase text-secondary/70">TITLE</div>
                    <div className="text-lg font-black tracking-tight text-white">{selectedMergeRequest.title}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black tracking-[0.2em] uppercase text-white/30">FLOW</div>
                    <div className="text-sm text-white/70">
                      {selectedMergeRequest.sourceBranch?.name}
                      {" -> "}
                      {selectedMergeRequest.targetBranch?.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black tracking-[0.2em] uppercase text-white/30">DESCRIPTION</div>
                    <div className="text-sm text-white/70 leading-relaxed">
                      {selectedMergeRequest.description || "No summary provided."}
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenMergeConfirm(selectedMergeRequest)}
                    className="w-full px-4 py-3 rounded-2xl bg-secondary text-white text-[10px] font-black tracking-[0.3em] uppercase hover:scale-105 transition-all"
                  >
                    MERGE_NOW
                  </button>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                    <div className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">COMMENTS</div>
                    {(selectedMergeRequest.comments || []).length === 0 ? (
                      <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
                        NO_COMMENTS
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                        {(selectedMergeRequest.comments || []).map((comment: any, idx: number) => (
                          <div key={comment.id} className="rounded-xl border border-white/10 bg-black/50 p-3">
                            <div className="text-[9px] font-black tracking-[0.3em] text-white/20 uppercase">
                              NOTE_{idx + 1}
                            </div>
                            <div className="text-xs text-white/70 mt-2">{comment.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        value={mergeCommentDraft}
                        onChange={(e) => onMergeCommentChange(e.target.value)}
                        placeholder="ADD COMMENT..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black tracking-[0.2em] uppercase outline-none focus:border-secondary/40"
                      />
                      <button
                        onClick={onSaveMergeComment}
                        className="px-3 py-2 rounded-xl bg-secondary text-white text-[9px] font-black tracking-[0.3em] uppercase hover:scale-105 transition-all"
                      >
                        SAVE
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
                  SELECT_PULL_REQUEST
                </div>
              )}
            </div>
            <div className="glass-panel rounded-[28px] border-white/10 p-6 space-y-4">
              <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">OPEN_PULL_REQUESTS</div>
              {mergeRequestsOpen.length === 0 ? (
                <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
                  NO_OPEN_REQUESTS
                </div>
              ) : (
                <div className="space-y-3">
                  {mergeRequestsOpen.map((request: any) => (
                    <div key={request.id} className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3">
                      <div className="text-xs font-black tracking-[0.2em] uppercase text-secondary/70">
                        {request.title}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase">
                        {request.sourceBranch?.name}
                        {" -> "}
                        {request.targetBranch?.name}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            onSelectMergeRequest(request.id);
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black tracking-[0.3em] uppercase hover:border-primary/40 transition-all"
                        >
                          SELECT
                        </button>
                        <button
                          onClick={() => onOpenMergeConfirm(request)}
                          className="flex-1 px-3 py-2 rounded-xl bg-primary text-black text-[9px] font-black tracking-[0.3em] uppercase hover:scale-105 transition-all"
                        >
                          MERGE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
