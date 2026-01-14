"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// --- 1. Staggered Container ---
export const StaggerContainer = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            filter: "blur(0px)",
            transition: { type: "spring", stiffness: 150, damping: 12 } 
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// --- 2. Holographic Card (Mouse Tracking) ---
export const NexusCard = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "group relative border border-white/10 bg-black/40 overflow-hidden rounded-xl",
        onClick && "cursor-pointer",
        className
      )}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(0, 242, 255, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 transition-all group-hover:border-cyan-400 group-hover:w-4 group-hover:h-4" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 transition-all group-hover:border-cyan-400 group-hover:w-4 group-hover:h-4" />
    </div>
  );
};

// --- 3. Decoding Text Effect ---
export const DecodingText = ({ text, className }: { text: string; className?: string }) => {
  const [displayText, setDisplayText] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={cn("font-mono", className)}>{displayText}</span>;
};

// --- 4. Glowing Button ---
export const NexusButton = ({ children, onClick, variant = "primary", className, icon: Icon }: any) => {
  return (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
            "relative px-6 py-3 rounded-lg font-bold tracking-wider overflow-hidden group",
            variant === "primary" 
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/20"
                : "bg-white/5 text-white border border-white/10 hover:bg-white/10",
            className
        )}
    >
        <span className="relative z-10 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </span>
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
    </motion.button>
  );
};

// --- 5. Background Grid ---
export const NexusGridBackground = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] animate-[pulse_4s_infinite]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/0 via-cyan-500/[0.02] to-black/0" />
        {/* Floating Particles */}
        {[...Array(5)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                initial={{ x: Math.random() * 1000, y: Math.random() * 1000, opacity: 0 }}
                animate={{ 
                    y: [0, -100], 
                    opacity: [0, 0.5, 0],
                }}
                transition={{ 
                    duration: Math.random() * 5 + 5, 
                    repeat: Infinity, 
                    delay: Math.random() * 5 
                }}
            />
        ))}
    </div>
);
