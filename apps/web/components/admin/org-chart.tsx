"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Shield, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgNode {
  id: string;
  name: string;
  type: "org" | "role" | "user";
  children?: OrgNode[];
}

interface OrgChartProps {
  data: OrgNode;
}

export function OrgChart({ data }: OrgChartProps) {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar p-10 bg-black/40 rounded-[40px] border border-white/5 min-h-[600px] flex items-center justify-center">
      <div className="relative flex flex-col items-center">
        <Node node={data} />
      </div>
    </div>
  );
}

function Node({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const isLeaf = !node.children || node.children.length === 0;

  return (
    <div className="flex flex-col items-center relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5, scale: 1.05 }}
        className={cn(
          "relative z-10 px-6 py-4 rounded-2xl border flex items-center gap-4 min-w-[200px] backdrop-blur-md transition-all duration-500",
          node.type === "org" ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_30px_rgba(0,242,255,0.1)]" :
          node.type === "role" ? "bg-secondary/10 border-secondary/40 text-secondary" :
          "bg-white/5 border-white/10 text-white/60"
        )}
      >
        <div className="p-2 rounded-lg bg-white/5">
          {node.type === "org" && <Building2 size={18} />}
          {node.type === "role" && <Shield size={18} />}
          {node.type === "user" && <User size={18} />}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-widest uppercase opacity-40">{node.type}</span>
          <span className="text-sm font-bold truncate max-w-[160px] uppercase">{node.name}</span>
        </div>
      </motion.div>

      {!isLeaf && (
        <div className="relative pt-12 flex gap-10">
          {/* Vertical line from parent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-white/10" />
          
          {/* Horizontal connecting line */}
          {node.children!.length > 1 && (
            <div className="absolute top-12 left-[100px] right-[100px] h-px bg-white/10" />
          )}

          {node.children!.map((child, i) => (
            <div key={child.id} className="relative">
                {/* Connector to child */}
                <Node node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
