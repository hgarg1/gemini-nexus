"use client";

import React from "react";
import { motion } from "framer-motion";

export function TypingWaveform() {
  return (
    <div className="flex items-center gap-1 h-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-secondary rounded-full"
          animate={{
            height: [4, 12, 4],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
