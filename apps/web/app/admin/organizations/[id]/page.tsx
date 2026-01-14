"use client";

import React, { useState, useEffect } from "react";
import { Shield, Save, Bot, Ban, Check, Lock, Unlock } from "lucide-react";
import { useParams } from "next/navigation";
import { 
  NexusCard, 
  NexusButton, 
  DecodingText, 
  StaggerContainer, 
  StaggerItem,
  NexusGridBackground
} from "@/components/ui/nexus-ui";

export default function OrganizationGovernancePage() {
  const { id } = useParams();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nexusPolicy, setNexusPolicy] = useState({
    allowBotCreation: true,
    maxBotsPerUser: 5,
    allowedModels: ["models/gemini-2.0-flash"]
  });

  useEffect(() => {
    // Stub: Fetch org details
    setTimeout(() => {
        setLoading(false);
        setOrg({ name: "Demo Corp", id });
    }, 800);
  }, [id]);

  const handleSave = async () => {
    alert("Policy updated (Stub)");
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center relative overflow-hidden">
        <NexusGridBackground />
        <div className="flex flex-col items-center gap-4 z-10">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <DecodingText text="ESTABLISHING_UPLINK..." className="text-cyan-400 font-bold tracking-widest text-xs" />
        </div>
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <NexusGridBackground />
      
      <div className="relative z-10 space-y-8">
        <StaggerContainer className="flex items-center justify-between">
          <StaggerItem>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
                <Shield className="w-8 h-8 text-cyan-400" />
                <DecodingText text={`GOVERNANCE: ${org?.name.toUpperCase()}`} />
            </h1>
            <p className="text-white/40 font-mono text-xs mt-1 tracking-widest">
                // SECURE PROTOCOLS // AUTHORIZATION LEVEL: ADMIN
            </p>
          </StaggerItem>
          <StaggerItem>
            <NexusButton onClick={handleSave} icon={Save}>
                COMMIT_POLICIES
            </NexusButton>
          </StaggerItem>
        </StaggerContainer>

        <StaggerContainer delay={0.2} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Access Control */}
          <StaggerItem>
            <NexusCard className="p-8 h-full bg-black/60 backdrop-blur-xl">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-6">
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <Bot className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide">Nexus Hub Access</h2>
                        <span className="text-xs text-white/40 font-mono">MODULE_01</span>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="space-y-1">
                            <div className="font-bold text-white tracking-wide flex items-center gap-2">
                                {nexusPolicy.allowBotCreation ? <Unlock className="w-3 h-3 text-green-400" /> : <Lock className="w-3 h-3 text-red-400" />}
                                Agent Creation
                            </div>
                            <div className="text-xs text-white/40 font-mono">Permit construction of custom neural entities.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={nexusPolicy.allowBotCreation}
                                onChange={(e) => setNexusPolicy({ ...nexusPolicy, allowBotCreation: e.target.checked })}
                                className="sr-only peer" 
                            />
                            <div className="w-14 h-7 bg-black border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/50 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-900/50 peer-checked:border-purple-500 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.3)]"></div>
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Allocation Limit</label>
                        <input 
                            type="number"
                            value={nexusPolicy.maxBotsPerUser}
                            onChange={(e) => setNexusPolicy({ ...nexusPolicy, maxBotsPerUser: parseInt(e.target.value) })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-purple-500/50 transition-colors"
                        />
                    </div>
                </div>
            </NexusCard>
          </StaggerItem>

          {/* Model Safety */}
          <StaggerItem>
            <NexusCard className="p-8 h-full bg-black/60 backdrop-blur-xl">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-6">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <Ban className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide">Safety Protocols</h2>
                        <span className="text-xs text-white/40 font-mono">MODULE_02</span>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Approved Neural Engines</label>
                    <div className="space-y-3">
                        {["models/gemini-2.0-flash", "models/gemini-pro", "models/gemini-ultra"].map(model => {
                            const isActive = nexusPolicy.allowedModels.includes(model);
                            return (
                                <div 
                                    key={model} 
                                    onClick={() => {
                                        if (isActive) {
                                            setNexusPolicy({ ...nexusPolicy, allowedModels: nexusPolicy.allowedModels.filter(m => m !== model) });
                                        } else {
                                            setNexusPolicy({ ...nexusPolicy, allowedModels: [...nexusPolicy.allowedModels, model] });
                                        }
                                    }}
                                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                                        isActive 
                                            ? "bg-red-500/10 border-red-500/50" 
                                            : "bg-white/5 border-white/10 opacity-50 hover:opacity-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${isActive ? "bg-red-500 animate-pulse" : "bg-white/20"}`} />
                                        <span className="text-sm font-mono text-white">{model}</span>
                                    </div>
                                    {isActive && <Check className="w-4 h-4 text-red-400" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </NexusCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </div>
  );
}