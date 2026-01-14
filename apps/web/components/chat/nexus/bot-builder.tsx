"use client";

import React, { useState } from "react";
import { ArrowLeft, Save, Sparkles, Upload, FileText, X, LayoutTemplate, BarChart3, Settings2, Wand2, AlertTriangle, CheckCircle } from "lucide-react";
import { SimulationChat } from "./simulation-chat";
import { BotAnalytics } from "./bot-analytics";
import { NexusButton, StaggerContainer, StaggerItem, NexusCard } from "@/components/ui/nexus-ui";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

const botSchema = z.object({
  name: z.string().min(2, "Designation must be at least 2 characters."),
  description: z.string().optional(),
  systemInstruction: z.string().min(10, "Core directives must be at least 10 characters to be effective."),
  isPublic: z.boolean().optional(),
  model: z.string(),
  temperature: z.number().min(0).max(1),
  skills: z.array(z.string()).optional(),
  appearance: z.any().optional(),
  tags: z.array(z.string()).optional(),
});

interface BotBuilderProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function BotBuilder({ initialData, onSave, onCancel }: BotBuilderProps) {
  const [activeTab, setActiveTab] = useState<"config" | "analytics">("config");
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    systemInstruction: initialData?.systemInstruction || "",
    isPublic: initialData?.isPublic || false,
    model: initialData?.config?.model || "models/gemini-2.0-flash",
    temperature: initialData?.config?.temperature || 0.7,
    skills: initialData?.skills || [],
    appearance: initialData?.appearance || {
        themeColor: "#00F2FF",
        avatarStyle: "default",
        animation: "default"
    },
    tags: initialData?.tags || [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: "success" | "error", message: string } | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };
  const [isSaving, setIsSaving] = useState(false);
  const [showSimulation, setShowSimulation] = useState(true);
  
  // Magic State
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [magicPrompt, setMagicPrompt] = useState("");
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 4000);
  };

  const handleMagicGenerate = async () => {
    if (!magicPrompt.trim()) return;
    setIsMagicLoading(true);
    try {
        const res = await fetch("/api/bots/generate-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: magicPrompt })
        });
        const data = await res.json();
        if (data.config) {
            setFormData(prev => ({
                ...prev,
                name: data.config.name,
                description: data.config.description,
                systemInstruction: data.config.systemInstruction,
                appearance: { ...prev.appearance, ...data.config.appearance },
                skills: data.config.skills || []
            }));
            setIsMagicOpen(false);
            setMagicPrompt("");
            showNotification("success", "Magic generation complete.");
        }
    } catch (e) {
        console.error(e);
        showNotification("error", "Magic generation failed.");
    } finally {
        setIsMagicLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
        ...prev,
        skills: prev.skills.includes(skill) 
            ? prev.skills.filter((s: string) => s !== skill)
            : [...prev.skills, skill]
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    if (!initialData?.id) {
        showNotification("error", "Please save the agent first before uploading knowledge.");
        return;
    }

    const formData = new FormData();
    Array.from(e.target.files).forEach(file => {
        formData.append("files", file);
    });

    try {
        const res = await fetch(`/api/bots/${initialData.id}/knowledge`, {
            method: "POST",
            body: formData
        });
        if (res.ok) {
            showNotification("success", "Knowledge ingested successfully.");
        } else {
            throw new Error("Upload failed");
        }
    } catch (e) {
        console.error(e);
        showNotification("error", "Failed to upload knowledge.");
    }
  };

  const handleDelete = async () => {
    if (!initialData || !confirm("Are you sure you want to delete this agent? This cannot be undone.")) return;
    setIsSaving(true);
    try {
        const res = await fetch(`/api/bots/${initialData.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
        onSave(null); 
    } catch (e) {
        console.error(e);
        showNotification("error", "Failed to delete agent.");
        setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validation = botSchema.safeParse(formData);
    if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.issues.forEach(issue => {
            newErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(newErrors);
        showNotification("error", "Please correct the errors before saving.");
        return;
    }

    setIsSaving(true);
    
    try {
        const url = initialData ? `/api/bots/${initialData.id}` : "/api/bots";
        const method = initialData ? "PATCH" : "POST";
        
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        
        if (!res.ok) {
            const data = await res.json();
            if (data.errors) {
               // Handle server side validation errors if any
               showNotification("error", "Server validation failed.");
            } else {
               throw new Error("Failed to save bot");
            }
            return;
        }
        
        const data = await res.json();
        showNotification("success", "Agent saved successfully.");
        // Short delay to show success animation
        setTimeout(() => {
             onSave(data.bot);
        }, 1000);
    } catch (e) {
        console.error(e);
        showNotification("error", "Failed to save agent. Check console.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/20 animate-in fade-in zoom-in-95 duration-200 relative">
      
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
            <motion.div
                initial={{ opacity: 0, y: -20, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: -20, x: "-50%" }}
                className={`absolute top-20 left-1/2 z-[100] px-6 py-3 rounded-full border shadow-2xl backdrop-blur-xl flex items-center gap-3 ${
                    notification.type === "success" 
                    ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-green-500/10" 
                    : "bg-red-500/20 border-red-500/50 text-red-400 shadow-red-500/10"
                }`}
            >
                {notification.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span className="font-bold text-sm tracking-wide">{notification.message}</span>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              {initialData ? "Configure Agent" : "New Agent"}
              <button 
                onClick={() => setIsMagicOpen(true)}
                className="text-xs bg-purple-500/10 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 hover:bg-purple-500/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Wand2 className="w-3 h-3" />
                Magic Designer
              </button>
            </h2>
            <p className="text-sm text-white/50 font-mono tracking-tight">Define identity, behavior, and knowledge.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        {initialData && (
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                    onClick={() => setActiveTab("config")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-wider transition-all ${activeTab === "config" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-white/40 hover:text-white"}`}
                >
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-3 h-3" />
                        CONFIG
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("analytics")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-wider transition-all ${activeTab === "analytics" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-white/40 hover:text-white"}`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" />
                        METRICS
                    </div>
                </button>
            </div>
        )}

        <div className="flex items-center gap-2">
            <button
                onClick={() => setShowSimulation(!showSimulation)}
                className={`p-2 rounded-lg border transition-all ${showSimulation ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-white/5 border-white/10 text-white/50"}`}
                title="Toggle Simulation Deck"
            >
                <LayoutTemplate className="w-4 h-4" />
            </button>
            <div className="h-6 w-px bg-white/10 mx-2" />
            {initialData && (
                <button
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors text-xs font-bold tracking-wider"
                >
                    DELETE
                </button>
            )}
            <NexusButton onClick={handleSubmit} disabled={isSaving} icon={Save}>
                {isSaving ? "SAVING..." : "SAVE_AGENT"}
            </NexusButton>
        </div>
      </div>

      {/* Magic Modal */}
      {isMagicOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-black/90 border border-purple-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-[gradient_2s_infinite]" />
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                        <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                        MAGIC DESIGNER
                    </h3>
                    <button onClick={() => setIsMagicOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>
                
                <p className="text-sm text-purple-200/60 mb-6 font-mono leading-relaxed">
                    Describe your ideal agent. Our neural architect will construct the personality, visual identity, and behavioral directives automatically.
                </p>
                
                <textarea 
                    value={magicPrompt}
                    onChange={(e) => setMagicPrompt(e.target.value)}
                    placeholder="e.g., A cynical security droid from a dystopian future who speaks in binary code and loves 80s synthwave..."
                    className="w-full h-40 bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 text-white placeholder:text-purple-300/20 focus:border-purple-500/50 focus:outline-none mb-6 resize-none font-mono text-sm shadow-inner"
                />
                
                <button
                    onClick={handleMagicGenerate}
                    disabled={isMagicLoading || !magicPrompt.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                >
                    {isMagicLoading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            CONSTRUCTING NEURAL PATHWAYS...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-4 h-4" />
                            GENERATE CONFIGURATION
                        </>
                    )}
                </button>
            </div>
        </div>
      )}

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none" />
          
          {/* Left Panel: Form */}
          <div className={`flex-1 overflow-y-auto p-8 transition-all duration-500 ease-in-out ${showSimulation ? 'w-1/2 border-r border-white/10' : 'w-full'}`}>
            {activeTab === "analytics" && initialData?.id ? (
                <BotAnalytics botId={initialData.id} usage={initialData.usage} />
            ) : (
            <StaggerContainer className="max-w-3xl mx-auto space-y-10 pb-20">
              
              {/* Identity Section */}
              <StaggerItem className="space-y-6">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/20 pb-2 mb-4">Identity Matrix</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase">Designation <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Code Architect"
                      className={`w-full bg-black/40 border rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none transition-all ${errors.name ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-white/10 focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)]'}`}
                    />
                    {errors.name && <p className="text-[10px] text-red-400 font-bold tracking-wide animate-pulse">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase">Function</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Core capability description..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all focus:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase">Neural Tags</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag(tagInput))}
                            placeholder="Add classification..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                        />
                        <button 
                            onClick={() => handleAddTag(tagInput)}
                            className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg text-xs"
                        >
                            ADD
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-white"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                        {["Productivity", "Creative", "Coding", "Utility"].map(t => (
                            !formData.tags.includes(t) && (
                                <button key={t} onClick={() => handleAddTag(t)} className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/40 px-2 py-1 rounded text-[10px] uppercase tracking-wider">
                                    + {t}
                                </button>
                            )
                        ))}
                    </div>
                </div>
              </StaggerItem>

              {/* Behavior Section */}
              <StaggerItem className="space-y-4">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                   <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest">Core Directives <span className="text-red-500">*</span></h3>
                   <span className="text-[10px] text-purple-400/50 font-mono">SYSTEM_PROMPT.MD</span>
                </div>
                
                <div className="relative group">
                   <textarea
                     value={formData.systemInstruction}
                     onChange={(e) => setFormData({ ...formData, systemInstruction: e.target.value })}
                     placeholder="Define the persona, rules, and output format..."
                     className={`w-full h-[300px] bg-black/40 border rounded-xl p-6 text-white/90 placeholder:text-white/20 focus:outline-none font-mono text-sm leading-relaxed resize-none transition-all ${errors.systemInstruction ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-white/10 focus:border-purple-500/50 focus:shadow-[0_0_20px_rgba(168,85,247,0.1)]'}`}
                   />
                   <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none group-hover:border-purple-500/20 transition-colors" />
                </div>
                {errors.systemInstruction && <p className="text-[10px] text-red-400 font-bold tracking-wide animate-pulse">{errors.systemInstruction}</p>}
              </StaggerItem>

              {/* Persona Section */}
              <StaggerItem className="space-y-6">
                 <h3 className="text-sm font-bold text-pink-400 uppercase tracking-widest border-b border-pink-500/20 pb-2">Persona Engine</h3>
                 <NexusCard className="p-6 space-y-6 bg-black/40">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-white/50 uppercase">Neural Interface Color</label>
                        <div className="flex gap-4">
                            {["#00F2FF", "#F43F5E", "#10B981", "#8B5CF6", "#F59E0B"].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setFormData(prev => ({ ...prev, appearance: { ...prev.appearance, themeColor: color } }))}
                                    className={`w-10 h-10 rounded-full border-2 transition-all duration-300 relative group ${
                                        formData.appearance?.themeColor === color ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                >
                                    {formData.appearance?.themeColor === color && (
                                        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase">Avatar Style</label>
                            <select
                                value={formData.appearance?.avatarStyle || "default"}
                                onChange={(e) => setFormData(prev => ({ ...prev, appearance: { ...prev.appearance, avatarStyle: e.target.value } }))}
                                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500/50 font-mono text-sm"
                            >
                                <option value="default">Standard Hologram</option>
                                <option value="retro">Retro Pixel</option>
                                <option value="cyber">Cyberpunk</option>
                                <option value="organic">Organic/Nature</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase">Response Motion</label>
                            <div className="grid grid-cols-2 gap-2">
                                {["default", "glitch", "liquid", "typewriter"].map(anim => (
                                    <button
                                        key={anim}
                                        onClick={() => setFormData(prev => ({ ...prev, appearance: { ...prev.appearance, animation: anim } }))}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                            formData.appearance?.animation === anim 
                                                ? "bg-pink-500/20 border-pink-500/50 text-pink-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]" 
                                                : "bg-white/5 border-white/5 text-white/30 hover:text-white hover:bg-white/10"
                                        }`}
                                    >
                                        {anim}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                 </NexusCard>
              </StaggerItem>

              {/* Skills Section */}
              <StaggerItem className="space-y-6">
                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest border-b border-orange-500/20 pb-2">Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                        onClick={() => toggleSkill('web_search')}
                        className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                            formData.skills.includes('web_search') 
                                ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]' 
                                : 'bg-black/40 border-white/10 hover:border-white/30'
                        }`}
                    >
                        <div className="flex items-center gap-4 mb-2 relative z-10">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.skills.includes('web_search') ? 'bg-orange-500 border-orange-500' : 'border-white/30'}`}>
                                {formData.skills.includes('web_search') && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="font-bold text-white tracking-wide">WEB SEARCH</span>
                        </div>
                        <p className="text-xs text-white/40 pl-9 leading-relaxed">Grant access to real-time global information networks.</p>
                        {formData.skills.includes('web_search') && (
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full pointer-events-none" />
                        )}
                    </div>

                    <div 
                        onClick={() => toggleSkill('image_generation')}
                        className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                            formData.skills.includes('image_generation') 
                                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                                : 'bg-black/40 border-white/10 hover:border-white/30'
                        }`}
                    >
                        <div className="flex items-center gap-4 mb-2 relative z-10">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.skills.includes('image_generation') ? 'bg-indigo-500 border-indigo-500' : 'border-white/30'}`}>
                                {formData.skills.includes('image_generation') && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="font-bold text-white tracking-wide">VISIONARY</span>
                        </div>
                        <p className="text-xs text-white/40 pl-9 leading-relaxed">Enable synthetic image generation capabilities.</p>
                        {formData.skills.includes('image_generation') && (
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
                        )}
                    </div>
                </div>
              </StaggerItem>

              {/* Knowledge Section */}
              <StaggerItem className="space-y-6 opacity-90">
                 <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-2">Knowledge Base</h3>
                 <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:bg-blue-500/[0.02] hover:border-blue-500/30 transition-all group cursor-pointer relative overflow-hidden">
                    <input 
                        type="file" 
                        multiple 
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                        id="file-upload"
                    />
                    <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-500 relative z-10">
                        <Upload className="w-8 h-8 text-white/30 group-hover:text-blue-400" />
                    </div>
                    <p className="text-white font-bold tracking-wide mb-1 relative z-10">UPLOAD TRAINING DATA</p>
                    <p className="text-xs text-white/30 mb-6 font-mono relative z-10">PDF, TXT, MD, JSON</p>
                    
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center relative z-10">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                            <FileText className="w-3 h-3" />
                            {f.name}
                            </div>
                        ))}
                        </div>
                    )}
                 </div>
              </StaggerItem>

              {/* Config Section */}
              <StaggerItem className="space-y-6">
                 <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-500/20 pb-2">Model Configuration</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 p-6 rounded-xl border border-white/10">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/50 uppercase">Base Model</label>
                      <select
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                      >
                        <option value="models/gemini-2.0-flash">Gemini 2.0 Flash (Fastest)</option>
                        <option value="models/gemini-pro">Gemini Pro (Balanced)</option>
                        <option value="models/gemini-ultra">Gemini Ultra (Most Capable)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/50 uppercase">Creativity: {formData.temperature}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        <span>Precise</span>
                        <span>Creative</span>
                      </div>
                    </div>
                 </div>
              </StaggerItem>
            </StaggerContainer>
            )}
          </div>

          {/* Right Panel: Simulation Deck */}
          {showSimulation && (
             <div className="w-[40%] h-full bg-black/40 backdrop-blur-xl border-l border-white/10 animate-in slide-in-from-right duration-500 relative z-20">
                <SimulationChat config={formData} botId={initialData?.id} />
             </div>
          )}
      </div>
    </div>
  );
}