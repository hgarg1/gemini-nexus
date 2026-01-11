"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Search, 
  ChevronRight, 
  Eye, 
  RefreshCw, 
  User, 
  FileJson,
  X,
  History,
  Shield,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLogViewProps {
  initialLogs: any[];
}

export function AuditLogView({ initialLogs }: AuditLogViewProps) {
  const [logs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedUser] = useState<any | null>(null);

  const filteredLogs = logs.filter(log => 
    log.user.email.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.resource?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 font-mono h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">AUDIT_STREAM</h1>
          <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mt-2">Real-time surveillance of administrative maneuvers</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-colors">
            <div className="pl-4 text-white/30"><Search className="w-4 h-4" /></div>
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="FILTER_STREAM..."
              className="w-full bg-transparent p-4 text-xs font-mono text-primary placeholder:text-white/20 outline-none uppercase"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
        <div className="glass-panel rounded-[32px] border-white/10 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.03] text-[10px] font-black tracking-[0.3em] text-white/30 uppercase border-b border-white/5">
              <tr>
                <th className="px-8 py-6">TIMESTAMP</th>
                <th className="px-8 py-6">OPERATIVE</th>
                <th className="px-8 py-6">ACTION</th>
                <th className="px-8 py-6">RESOURCE</th>
                <th className="px-8 py-6 text-right">METRICS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredLogs.map((log, i) => (
                  <motion.tr 
                    layout
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="group hover:bg-white/[0.02] transition-all cursor-pointer"
                    onClick={() => setSelectedUser(log)}
                  >
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-bold text-white/40 group-hover:text-white transition-colors uppercase">
                        {new Date(log.createdAt).toLocaleDateString()}
                        <div className="font-mono text-[9px] opacity-50">{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                            {log.user.image ? <img src={log.user.image} className="w-full h-full object-cover" /> : <User size={14} className="text-white/20" />}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white uppercase">{log.user.name || "UNIDENTIFIED"}</div>
                            <div className="text-[9px] text-white/30 font-mono">{log.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border transition-all",
                        log.action.includes('delete') || log.action.includes('ban') ? "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" :
                        log.action.includes('create') ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        "bg-primary/10 text-primary border-primary/20"
                      )}>
                        <Activity size={10} />
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-mono text-white/40 uppercase truncate max-w-[120px]">
                        {log.resource || "GLOBAL_STATE"}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <button className="p-2.5 rounded-xl bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-all border border-transparent group-hover:border-primary/20">
                            <Eye size={14} />
                        </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150]"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl glass-panel rounded-[40px] border-white/10 p-12 z-[160] overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4 text-primary">
                    <History size={24} />
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase">EVENT_SNAPSHOT</h2>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] font-mono">RECORD_ID: {selectedLog.id}</p>
                    </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-4 hover:bg-white/5 rounded-2xl transition-all"><X size={20} className="text-white/40" /></button>
              </div>

              <div className="grid md:grid-cols-2 gap-10 mb-10">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">Action Details</label>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-sm font-bold text-white uppercase mb-1">{selectedLog.action.replace(/_/g, ' ')}</div>
                            <div className="text-[10px] text-primary font-mono">{selectedLog.resource || "Global Resource"}</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">Origin Agent</label>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-white/5">
                                {selectedLog.user.image ? <img src={selectedLog.user.image} className="w-full h-full object-cover" /> : <User size={18} className="text-white/20" />}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white uppercase">{selectedLog.user.name}</div>
                                <div className="text-[10px] text-white/30 font-mono">{selectedLog.user.email}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest flex justify-between">
                        METADATA_PAYLOAD
                        {selectedLog.details?.snapshot && (
                            <span className="text-primary text-[8px] font-black">RECOVERABLE_HISTORY</span>
                        )}
                    </label>
                    <div className="h-[200px] overflow-y-auto p-4 rounded-2xl bg-black/60 border border-white/5 font-mono text-[10px] custom-scrollbar text-white/60 leading-relaxed whitespace-pre-wrap">
                        {selectedLog.details ? JSON.stringify(selectedLog.details, null, 2) : "NO_METADATA_CACHED"}
                    </div>
                </div>
              </div>

              {selectedLog.details?.snapshot && (
                <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <FileJson size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-black text-white uppercase">Neural Stream Recovery Available</div>
                                <div className="text-[9px] text-white/40 uppercase mt-1">Snapshot contains {selectedLog.details.snapshot.length} message nodes.</div>
                            </div>
                        </div>
                        <button className="px-6 py-3 rounded-xl bg-primary text-black text-[10px] font-black tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                            <Download size={14} /> DOWNLOAD_DATA
                        </button>
                    </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
