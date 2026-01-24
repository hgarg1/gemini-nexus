"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MessageSquare, HardDrive, Cpu, Activity, Zap, TrendingUp } from "lucide-react";
import { io } from "socket.io-client";

interface StatsGridProps {
  stats: {
    users: number;
    chats: number;
    messages: number;
    memories: number;
  };
}

export function StatsGrid({ stats: initialStats }: StatsGridProps) {
  const [liveStats, setLiveStats] = useState(initialStats);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socket = io(socketUrl);

    socket.on("system-telemetry", (data) => {
      setLiveStats(prev => ({
        ...prev,
        ...data
      }));
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    });

    return () => { socket.disconnect(); };
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 w-fit">
        <TrendingUp className={cn("w-3 h-3 text-primary transition-transform duration-500", pulse && "scale-125")} />
        <span className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">Live_System_Telemetry</span>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          variants={item}
          title="TOTAL OPERATIVES" 
          value={liveStats.users} 
          icon={<Users />} 
          color="text-primary" 
          bg="bg-primary/10" 
          border="border-primary/20"
          pulse={pulse}
        />
        <StatCard 
          variants={item}
          title="ACTIVE CHANNELS" 
          value={liveStats.chats} 
          icon={<MessageSquare />} 
          color="text-secondary" 
          bg="bg-secondary/10" 
          border="border-secondary/20"
          pulse={pulse}
        />
        <StatCard 
          variants={item}
          title="DATA FRAGMENTS" 
          value={liveStats.messages} 
          icon={<HardDrive />} 
          color="text-accent" 
          bg="bg-accent/10" 
          border="border-accent/20"
          pulse={pulse}
        />
        <StatCard 
          variants={item}
          title="NEURAL MEMORIES" 
          value={liveStats.memories} 
          icon={<Cpu />} 
          color="text-white" 
          bg="bg-white/5" 
          border="border-white/10"
          pulse={pulse}
        />
      </motion.div>
    </div>
  );
}

import { cn } from "@/lib/utils";

function StatCard({ title, value, icon, color, bg, border, variants, pulse }: any) {
  return (
    <motion.div 
      variants={variants}
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "p-6 rounded-[24px] border backdrop-blur-md relative overflow-hidden group transition-all duration-500",
        border,
        bg,
        pulse && "border-white/40 bg-white/5"
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
        <div className={cn(color, "scale-150")}>{icon}</div>
      </div>
      <div className="relative z-10">
        <div className={cn("text-[10px] font-black tracking-[0.2em] uppercase mb-2", color)}>{title}</div>
        <div className="text-4xl font-black tracking-tighter text-white">
          <AnimatePresence mode="wait">
            <motion.span
              key={value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block"
            >
              {value.toLocaleString()}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <div className={cn("absolute bottom-0 left-0 right-0 h-1", bg.replace('/10', '/30'))} />
    </motion.div>
  );
}
