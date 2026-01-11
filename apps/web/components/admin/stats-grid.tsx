"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, HardDrive, Cpu, Activity, Zap } from "lucide-react";

interface StatsGridProps {
  stats: {
    users: number;
    chats: number;
    messages: number;
    memories: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
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
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <StatCard 
        variants={item}
        title="TOTAL OPERATIVES" 
        value={stats.users} 
        icon={<Users />} 
        color="text-primary" 
        bg="bg-primary/10" 
        border="border-primary/20"
      />
      <StatCard 
        variants={item}
        title="ACTIVE CHANNELS" 
        value={stats.chats} 
        icon={<MessageSquare />} 
        color="text-secondary" 
        bg="bg-secondary/10" 
        border="border-secondary/20"
      />
      <StatCard 
        variants={item}
        title="DATA FRAGMENTS" 
        value={stats.messages} 
        icon={<HardDrive />} 
        color="text-accent" 
        bg="bg-accent/10" 
        border="border-accent/20"
      />
      <StatCard 
        variants={item}
        title="NEURAL MEMORIES" 
        value={stats.memories} 
        icon={<Cpu />} 
        color="text-white" 
        bg="bg-white/5" 
        border="border-white/10"
      />
    </motion.div>
  );
}

function StatCard({ title, value, icon, color, bg, border, variants }: any) {
  return (
    <motion.div 
      variants={variants}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`p-6 rounded-[24px] border ${border} ${bg} backdrop-blur-md relative overflow-hidden group`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
        <div className={`${color} scale-150`}>{icon}</div>
      </div>
      <div className="relative z-10">
        <div className={`text-[10px] font-black tracking-[0.2em] uppercase ${color} mb-2`}>{title}</div>
        <div className="text-4xl font-black tracking-tighter text-white">
          {value.toLocaleString()}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${bg.replace('/10', '/30')}`} />
    </motion.div>
  );
}
