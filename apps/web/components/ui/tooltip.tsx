"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  offset?: number;
}

export function Tooltip({ content, children, side = "right", offset = 10 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: { bottom: "100%", left: "50%", x: "-50%", marginBottom: offset },
    right: { top: "50%", left: "100%", y: "-50%", marginLeft: offset },
    bottom: { top: "100%", left: "50%", x: "-50%", marginTop: offset },
    left: { top: "50%", right: "100%", y: "-50%", marginRight: offset },
  };

  const initial = {
    opacity: 0,
    scale: 0.9,
    ...((side === "top" || side === "bottom") && { y: side === "top" ? 5 : -5 }),
    ...((side === "left" || side === "right") && { x: side === "left" ? 5 : -5 }),
  };

  const animate = {
    opacity: 1,
    scale: 1,
    x: side === "top" || side === "bottom" ? "-50%" : 0,
    y: side === "left" || side === "right" ? "-50%" : 0,
  };

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={initial}
            animate={animate}
            exit={initial}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={positions[side] as any}
            className="absolute z-50 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black tracking-[0.2em] text-white uppercase whitespace-nowrap shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"
          >
            {content}
            {/* Cyberpunk decoration */}
            <div className="absolute inset-0 rounded-lg border border-primary/20" />
            <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-primary/50" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
