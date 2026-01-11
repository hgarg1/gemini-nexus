"use client";

import React from "react";
import { cn } from "../../../lib/utils";
import { Tooltip } from "../../ui/tooltip";

interface SidebarNavIconProps {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

export function SidebarNavIcon({ icon, active = false, onClick, tooltip }: SidebarNavIconProps) {
  const button = (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl transition-all duration-300 relative group",
        active ? "text-primary bg-primary/10 shadow-[0_0_20px_rgba(0,242,255,0.2)]" : "text-white/30 hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[2px_0_10px_#00f2ff]" />} 
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} side="right">
        {button}
      </Tooltip>
    );
  }

  return button;
}