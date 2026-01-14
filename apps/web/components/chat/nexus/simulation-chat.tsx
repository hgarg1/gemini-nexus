"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  content: string;
}

interface SimulationChatProps {
  config: {
    systemInstruction: string;
    model: string;
    temperature: number;
    appearance?: {
        themeColor?: string;
        avatarStyle?: string;
        animation?: "default" | "glitch" | "liquid" | "typewriter";
    };
  };
  botId?: string;
}

export function SimulationChat({ config, botId }: SimulationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const getAnimationClass = (role: string) => {
    if (role === "user") return "animate-in slide-in-from-bottom-2 duration-300";
    
    switch (config.appearance?.animation) {
        case "glitch":
            return "animate-pulse font-mono tracking-tighter"; // Simplified glitch
        case "liquid":
            return "animate-in zoom-in-90 duration-700 ease-out"; // Soft bubble effect
        case "typewriter":
            return "animate-in fade-in duration-1000"; // Slow fade imitating typing presence
        default:
            return "animate-in fade-in duration-300";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: input } as Message];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/bots/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          config: {
            model: config.model,
            temperature: config.temperature
          },
          systemInstruction: config.systemInstruction,
          skills: (config as any).skills,
          botId
        }),
      });

      if (!response.ok) throw new Error("Simulation failed");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages(prev => [...prev, { role: "model", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        assistantMessage += text;
        
        setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "model", content: assistantMessage };
            return updated;
        });
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "model", content: "Error: Connection interrupted." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border-l border-white/10">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-xs font-bold text-white/70 tracking-wider">SIMULATION_DECK</span>
        </div>
        <button 
           onClick={() => setMessages([])} 
           className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
           title="Clear Context"
        >
           <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/20">
            <Bot className="w-8 h-8 mb-2" />
            <p>Ready to test.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"} ${getAnimationClass(m.role)}`}>
            {m.role === "model" && (
                <div 
                    className="w-6 h-6 rounded flex items-center justify-center mt-1 flex-shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                    style={{ 
                        backgroundColor: `${config.appearance?.themeColor}20` || "rgba(255,255,255,0.1)",
                        border: `1px solid ${config.appearance?.themeColor}40` || "transparent"
                    }}
                >
                    <Bot className="w-3 h-3" style={{ color: config.appearance?.themeColor || "white" }} />
                </div>
            )}
            <div 
                className={`max-w-[85%] p-3 rounded-xl backdrop-blur-sm ${
                m.role === "user" 
                    ? "bg-primary/10 text-white border border-primary/20" 
                    : "bg-white/5 text-white/80 border border-white/10"
                }`}
                style={m.role === "model" && config.appearance?.animation === "glitch" ? {
                    textShadow: `2px 0 ${config.appearance.themeColor}, -2px 0 red`
                } : {}}
            >
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
             <div className="flex gap-3 justify-start">
                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center mt-1 flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <RefreshCw className="w-4 h-4 text-white/40 animate-spin" />
                </div>
             </div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/10">
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Send test message..."
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50"
            />
            <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2 bg-primary text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
}
