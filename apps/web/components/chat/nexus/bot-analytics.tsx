"use client";

import React from "react";
import { Activity, Users, Zap, TrendingUp } from "lucide-react";

interface BotAnalyticsProps {
  botId: string;
  usage: {
    interactionCount: number;
    tokenCount: number;
    updatedAt: string;
  };
}

export function BotAnalytics({ botId, usage }: BotAnalyticsProps) {
  // Mock data for the chart since we don't have timeseries DB yet
  const mockTrend = [40, 65, 30, 80, 55, 90, 70];
  const maxVal = Math.max(...mockTrend);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
       <h3 className="text-lg font-semibold text-white border-l-4 border-cyan-500 pl-3">Neural Metrics</h3>
       
       <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
             <div className="flex items-center gap-2 text-white/50 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs uppercase font-bold">Interactions</span>
             </div>
             <div className="text-2xl font-mono text-white">{usage?.interactionCount || 0}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
             <div className="flex items-center gap-2 text-white/50 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs uppercase font-bold">Token Burn</span>
             </div>
             <div className="text-2xl font-mono text-white">{(usage?.tokenCount || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
             <div className="flex items-center gap-2 text-white/50 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs uppercase font-bold">Efficiency</span>
             </div>
             <div className="text-2xl font-mono text-green-400">94%</div>
          </div>
       </div>

       <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
             <h4 className="text-white font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Activity Pulse (7 Days)
             </h4>
          </div>
          
          <div className="flex items-end justify-between h-32 gap-2">
             {mockTrend.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                   <div 
                     className="w-full bg-primary/20 rounded-t group-hover:bg-primary/40 transition-all relative overflow-hidden"
                     style={{ height: `${(val / maxVal) * 100}%` }}
                   >
                     <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/50" />
                   </div>
                   <span className="text-[10px] text-white/30">D-{7-i}</span>
                </div>
             ))}
          </div>
       </div>

       <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
          <h4 className="text-yellow-400 font-bold text-sm mb-1">Optimization Tip</h4>
          <p className="text-xs text-yellow-200/70">
             Your token usage per interaction is 15% higher than average. Consider compressing your System Instructions to reduce context overhead.
          </p>
       </div>
    </div>
  );
}
