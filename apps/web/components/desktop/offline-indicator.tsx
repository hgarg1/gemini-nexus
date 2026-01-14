"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">NEURAL_UPLINK_SEVERED</span>
            <RefreshCw className="w-3 h-3 animate-spin opacity-50" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
