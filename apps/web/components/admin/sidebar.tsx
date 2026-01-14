"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, 
  Users, 
  Settings, 
  ShieldAlert, 
  Activity, 
  LogOut,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  Building2,
  Menu,
  X,
  Shield,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: window.location.origin + "/login" });
  };

  const navLinks = [
    { href: "/admin", icon: <LayoutGrid />, label: "COMMAND_CENTER" },
    { href: "/admin/users", icon: <Users />, label: "OPERATIVES" },
    { href: "/admin/roles", icon: <ShieldCheck />, label: "ACCESS_PROTOCOLS" },
    { href: "/admin/organizations", icon: <Building2 />, label: "ORGANIZATIONS" },
    { href: "/admin/bots", icon: <Bot />, label: "GLOBAL_BOTS" },
    { href: "/admin/controls/chat", icon: <MessageSquare />, label: "CHAT_PROTOCOLS" },
    { href: "/admin/logs", icon: <ScrollText />, label: "AUDIT_LOGS" },
    { href: "/admin/settings", icon: <Settings />, label: "SYSTEM_CORE" },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-6 px-4">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,242,255,0.3)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white">NEXUS_ADMIN</span>
        </div>
        
        <nav className="space-y-1">
           {navLinks.map((link) => (
             <NavLink 
               key={link.href}
               href={link.href} 
               icon={link.icon} 
               label={link.label} 
               active={pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))}
               onClick={() => setIsMobileOpen(false)}
             />
           ))}
        </nav>
      </div>

      <div className="space-y-4 pt-6 border-t border-white/5">
        <Link 
          href="/chat"
          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all group"
        >
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/10 transition-colors">
            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs font-bold tracking-[0.2em]">RETURN_TO_CHAT</span>
        </Link>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-500/10 text-white/60 hover:text-red-500 transition-all group"
        >
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs font-bold tracking-[0.2em]">TERMINATE</span>
        </button>
        <div className="flex items-center gap-3 px-3 text-white/20">
          <Activity className="w-3 h-3 text-green-500 animate-pulse" />
          <span className="text-[8px] font-black tracking-[0.3em] uppercase">LINK_STABLE</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-primary shadow-2xl active:scale-90 transition-transform"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-white/10 bg-black/80 backdrop-blur-3xl flex-col z-20 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-black/90 border-r border-white/10 z-[55] lg:hidden backdrop-blur-3xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, icon, label, active, onClick }: { href: string; icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-3 rounded-2xl transition-all group relative overflow-hidden",
        active ? "text-primary shadow-[0_0_20px_rgba(0,242,255,0.1)]" : "text-white/40 hover:text-white"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl border transition-all duration-500 z-10",
        active ? "bg-primary/10 border-primary/30 scale-110" : "bg-white/5 border-white/5 group-hover:border-white/20"
      )}>
        {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 18 }) : icon}
      </div>
      <span className="text-[10px] font-black tracking-[0.2em] z-10">{label}</span>
      
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="absolute inset-0 bg-white/[0.03] border border-white/5 rounded-2xl -z-0" 
        />
      )}
    </Link>
  );
}