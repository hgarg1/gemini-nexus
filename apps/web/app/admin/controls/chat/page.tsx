"use client";

import React, { useEffect, useState } from "react";
import { 
  Shield, 
  MessageSquare, 
  Users, 
  Globe, 
  Lock, 
  Zap, 
  FileText, 
  Save, 
  AlertTriangle,
  Server
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatProtocolsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<any>({});
  const [orgOverride, setOrgOverride] = useState<any>({});

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const res = await fetch("/api/admin/chat/policy");
      const data = await res.json();
      if (data.policy) {
        setPolicy(data.policy);
        setOrgOverride(data.orgOverride);
      }
    } catch (err) {
      console.error("Failed to load chat policy", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/chat/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy, orgOverride }),
      });
      // Optional: Show success toast
    } catch (err) {
      console.error("Failed to save chat policy", err);
    } finally {
      setSaving(false);
    }
  };

  const togglePolicy = (key: string) => {
    setPolicy((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleOverride = (key: string) => {
    setOrgOverride((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[10px] font-black tracking-[0.3em] text-white/20 animate-pulse">LOADING_PROTOCOLS...</div>
      </div>
    );
  }

  const FeatureToggle = ({ label, description, pKey, icon: Icon }: { label: string, description: string, pKey: string, icon: any }) => (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white/90">{label}</div>
            <div className="text-[10px] font-medium text-white/40 mt-1">{description}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={() => togglePolicy(pKey)}
                className={cn(
                    "relative w-12 h-6 rounded-full transition-colors flex items-center",
                    policy[pKey] ? "bg-primary" : "bg-white/10"
                )}
            >
                <div className={cn(
                    "w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1",
                    policy[pKey] ? "translate-x-6" : "translate-x-0"
                )} />
            </button>
            <div className="flex items-center gap-2" title="Allow Organization Admins to restrict this setting">
                <span className="text-[8px] font-black tracking-widest text-white/20 uppercase">DELEGATE</span>
                <button
                    onClick={() => toggleOverride(pKey)}
                    className={cn(
                        "w-3 h-3 rounded-full border transition-all",
                        orgOverride[pKey] ? "bg-secondary border-secondary" : "border-white/20 hover:border-white/40"
                    )}
                />
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">CHAT_PROTOCOLS</h1>
          <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mt-2">Global Communication Governance</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? <Server className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>SAVE_CONFIG</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Security Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-black tracking-[0.2em] uppercase">SECURITY_CORE</h2>
          </div>
          
          <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-6">
            <div>
              <label className="text-xs font-bold text-white/60 mb-3 block">ADMIN_INTERCOM_CONSTRAINT</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/5">
                {["none", "admins_only"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPolicy((prev: any) => ({ ...prev, adminChatConstraint: opt }))}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all",
                      policy.adminChatConstraint === opt ? "bg-accent text-black" : "text-white/40 hover:text-white"
                    )}
                  >
                    {opt.replace("_", " ")}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/30 mt-2">
                Restricts who system administrators can initiate conversations with. 
                {policy.adminChatConstraint === "admins_only" ? " Admins can ONLY chat with other admins." : " Admins have unrestricted access."}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-accent" />
                    <div>
                        <div className="text-sm font-bold">Admin Bypass</div>
                        <div className="text-[10px] text-white/40">Allow admins to ignore certain restrictions</div>
                    </div>
                </div>
                <button
                    onClick={() => togglePolicy("adminBypass")}
                    className={cn(
                        "relative w-12 h-6 rounded-full transition-colors flex items-center",
                        policy.adminBypass ? "bg-accent" : "bg-white/10"
                    )}
                >
                    <div className={cn(
                        "w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1",
                        policy.adminBypass ? "translate-x-6" : "translate-x-0"
                    )} />
                </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-4 border-b border-white/5 mt-8">
            <Globe className="w-5 h-5 text-secondary" />
            <h2 className="text-sm font-black tracking-[0.2em] uppercase">NETWORK_FEATURES</h2>
          </div>

          <div className="grid gap-4">
             <FeatureToggle pKey="allowPublicLinks" label="Public Links" description="Share chats via public URL" icon={Globe} />
             <FeatureToggle pKey="allowCollaborators" label="Collaboration" description="Invite others to chats" icon={Users} />
             <FeatureToggle pKey="allowFriendRequests" label="Friend Requests" description="User-to-user connection requests" icon={Users} />
          </div>
        </section>

        {/* Content Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black tracking-[0.2em] uppercase">CONTENT_POLICY</h2>
          </div>

          <div className="grid gap-4">
             <FeatureToggle pKey="allowDirectMessages" label="Direct Messages" description="1:1 private messaging" icon={MessageSquare} />
             <FeatureToggle pKey="allowGroupChats" label="Group Chats" description="Multi-user channels" icon={Users} />
             <FeatureToggle pKey="allowFileUploads" label="File Uploads" description="Image/File attachments" icon={FileText} />
             <FeatureToggle pKey="allowModelSelection" label="Model Selection" description="User can change AI model" icon={Zap} />
             <FeatureToggle pKey="allowCustomApiKey" label="Custom API Keys" description="Users can bring their own keys" icon={Lock} />
             <FeatureToggle pKey="allowEmailNotifications" label="Email Notifications" description="Send email alerts for messages" icon={Zap} />
          </div>

          <div className="flex items-center gap-3 pb-4 border-b border-white/5 mt-8">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-red-500/80">DESTRUCTIVE_ACTIONS</h2>
          </div>

          <div className="grid gap-4">
             <FeatureToggle pKey="allowDeleteThreads" label="Delete Threads" description="Users can delete full history" icon={AlertTriangle} />
             <FeatureToggle pKey="allowLeaveThreads" label="Leave Threads" description="Users can leave group chats" icon={AlertTriangle} />
          </div>
        </section>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-4 text-blue-200 text-xs">
         <AlertTriangle className="w-5 h-5 flex-shrink-0" />
         <div>
            <strong className="block mb-1 font-bold">DELEGATION NOTE</strong>
            When <span className="inline-block w-2 h-2 rounded-full bg-secondary align-middle mx-1" /> is checked, Organization Admins can restrict (disable) the feature for their members, even if enabled globally. If unchecked, the Global setting is enforced and cannot be overridden.
         </div>
      </div>
    </div>
  );
}
