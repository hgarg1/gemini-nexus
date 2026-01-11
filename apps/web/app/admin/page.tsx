import { prisma } from "@repo/database";
import { StatsGrid } from "@/components/admin/stats-grid";
import { Activity, ShieldCheck, Server } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [userCount, chatCount, messageCount, memoryCount] = await Promise.all([
    prisma.user.count(),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.memory.count(),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">COMMAND_CENTER</h1>
          <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mt-2">Real-time system telemetry</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black tracking-[0.2em]">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          ONLINE
        </div>
      </div>

      <StatsGrid 
        stats={{
          users: userCount,
          chats: chatCount,
          messages: messageCount,
          memories: memoryCount
        }} 
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-xs font-black tracking-[0.2em] uppercase">SYSTEM_PULSE</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-white/40" />
                <span className="text-[10px] font-bold tracking-widest text-white/60">DATABASE_LATENCY</span>
              </div>
              <span className="text-xs font-mono text-primary">12ms</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-white/40" />
                <span className="text-[10px] font-bold tracking-widest text-white/60">AUTH_GATEWAY</span>
              </div>
              <span className="text-xs font-mono text-secondary">SECURE</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-white/40" />
                <span className="text-[10px] font-bold tracking-widest text-white/60">API_UPTIME</span>
              </div>
              <span className="text-xs font-mono text-accent">99.9%</span>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col justify-center items-center text-center">
           <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4 animate-[spin_10s_linear_infinite]">
              <div className="w-16 h-16 rounded-full bg-primary/10 blur-xl" />
           </div>
           <div className="text-lg font-black tracking-tight text-white">NEURAL ENGINE IDLE</div>
           <div className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mt-2">Ready for instructions</div>
        </div>
      </div>
    </div>
  );
}
