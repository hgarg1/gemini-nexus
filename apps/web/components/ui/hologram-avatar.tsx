"use client";

import React from "react";
import { motion } from "framer-motion";

export const HologramAvatar = ({ color = "#00F2FF" }: { color?: string }) => {
  return (
    <div className="relative w-full h-48 flex items-center justify-center perspective-1000">
      <motion.div
        className="w-20 h-20 relative preserve-3d"
        animate={{ rotateY: 360, rotateX: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 border-2 opacity-50 bg-black/20 backdrop-blur-sm"
            style={{
              borderColor: color,
              boxShadow: `0 0 15px ${color}`,
              transform: getFaceTransform(i)
            }}
          >
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
             </div>
          </div>
        ))}
      </motion.div>
      {/* Platform */}
      <div className="absolute bottom-10 w-32 h-32 rounded-full border border-white/10" style={{ transform: "rotateX(70deg)", background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }} />
    </div>
  );
};

function getFaceTransform(index: number) {
  const translate = "translateZ(40px)";
  switch (index) {
    case 0: return `rotateY(0deg) ${translate}`;
    case 1: return `rotateY(90deg) ${translate}`;
    case 2: return `rotateY(180deg) ${translate}`;
    case 3: return `rotateY(-90deg) ${translate}`;
    case 4: return `rotateX(90deg) ${translate}`;
    case 5: return `rotateX(-90deg) ${translate}`;
    default: return "";
  }
}
