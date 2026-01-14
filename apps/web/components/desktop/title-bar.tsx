"use client";

import React, { useEffect, useState } from "react";
import { Minus, Square, X, Hexagon } from "lucide-react";

export function TitleBar() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if running in Electron environment
    if (typeof window !== "undefined" && (window as any).nexusDesktop) {
      setIsDesktop(true);
    }
  }, []);

  if (!isDesktop) return null;

  const handleControl = (action: "minimize" | "maximize" | "close") => {
    (window as any).nexusDesktop?.windowControl(action);
  };

  return (
    <div className="h-10 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 select-none app-region-drag fixed top-0 left-0 right-0 z-[100]">
      <div className="flex items-center gap-2 text-white/40">
        <Hexagon className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-[10px] font-black tracking-[0.3em] uppercase">NEXUS_CORE</span>
      </div>
      
      <div className="flex items-center gap-2 app-region-no-drag">
        <button 
          onClick={() => handleControl("minimize")}
          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button 
          onClick={() => handleControl("maximize")}
          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button 
          onClick={() => handleControl("close")}
          className="p-2 hover:bg-red-500/20 rounded-lg text-white/60 hover:text-red-500 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      <style jsx global>{`
        .app-region-drag {
          -webkit-app-region: drag;
        }
        .app-region-no-drag {
          -webkit-app-region: no-drag;
        }
        ${isDesktop ? `
          main, .min-h-screen {
            padding-top: 2.5rem !important;
          }
        ` : ''}
      `}</style>
    </div>
  );
}
