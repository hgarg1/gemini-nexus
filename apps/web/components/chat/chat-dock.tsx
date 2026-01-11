"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  GitBranch,
  Brain,
  LayoutGrid,
  Users,
  Fingerprint,
  Info,
  Terminal as TerminalIcon,
  ImageIcon,
  ShieldAlert,
} from "lucide-react";
import { SidebarNavIcon } from "./ui/sidebar-nav-icon";

interface ChatDockProps {
  activeTab: string;
  onTabChange: (tab: "chat" | "grid" | "users" | "assets" | "memory" | "version") => void;
  isShareOpen: boolean;
  onShare: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  isInfoOpen: boolean;
  onToggleInfo: () => void;
  onShowError: (title: string, msg: string) => void;
  isAdmin?: boolean;
}

export function ChatDock({
  activeTab,
  onTabChange,
  isShareOpen,
  onShare,
  isSettingsOpen,
  onToggleSettings,
  isInfoOpen,
  onToggleInfo,
  onShowError,
  isAdmin = false,
}: ChatDockProps) {
  const router = useRouter();

  return (
    <aside className="w-full md:w-16 flex md:flex-col flex-row items-center md:py-6 py-3 glass-panel border-t md:border-t-0 border-r md:border-r border-white/5 z-40 md:relative fixed bottom-0 left-0 right-0 h-16 md:h-auto px-4 md:px-0 justify-between">
      <div className="w-10 h-10 bg-primary/20 rounded-xl hidden md:flex items-center justify-center border border-primary/40 mb-10">
        <TerminalIcon className="text-primary w-5 h-5" />
      </div>
      <div className="flex-1 flex md:flex-col flex-row gap-4 md:gap-6 items-center justify-around">
        <SidebarNavIcon
          icon={<MessageSquare />}
          active={activeTab === "chat"}
          onClick={() => onTabChange("chat")}
          tooltip="NEURAL STREAM"
        />
        <SidebarNavIcon
          icon={<GitBranch />}
          active={activeTab === "version"}
          onClick={() => onTabChange("version")}
          tooltip="VERSION VAULT"
        />
        <SidebarNavIcon
          icon={<Brain />}
          active={activeTab === "memory"}
          onClick={() => onTabChange("memory")}
          tooltip="MEMORY GRID"
        />
        <SidebarNavIcon
          icon={<ImageIcon />}
          active={activeTab === "assets"}
          onClick={() => onTabChange("assets")}
          tooltip="VISUAL ASSETS"
        />
        <SidebarNavIcon
          icon={<LayoutGrid />}
          active={activeTab === "grid"}
          onClick={() => {
            onTabChange("grid");
            onShowError(
              "DASHBOARD_ACCESS",
              "Neural Grid view is currently undergoing optimization. Performance metrics will be available in the next release."
            );
          }}
          tooltip="DASHBOARD"
        />
        {isAdmin && (
          <SidebarNavIcon
            icon={<ShieldAlert />}
            active={false}
            onClick={() => router.push("/admin")}
            tooltip="ADMIN PORTAL"
          />
        )}
        <SidebarNavIcon 
          icon={<Users />} 
          active={isShareOpen} 
          onClick={onShare} 
          tooltip="COLLABORATE"
        />
      </div>
      <div className="flex md:flex-col flex-row gap-4 md:gap-6 items-center">
        <SidebarNavIcon
          icon={<Fingerprint />}
          active={isSettingsOpen}
          onClick={onToggleSettings}
          tooltip="CONFIG"
        />
        <SidebarNavIcon 
          icon={<Info />} 
          active={isInfoOpen} 
          onClick={onToggleInfo} 
          tooltip="SYSTEM INFO"
        />
      </div>
    </aside>
  );
}