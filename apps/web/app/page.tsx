"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Terminal, Cpu, Shield, Zap, Database, GitBranch, Share2, Layers } from "lucide-react";
import Hyperspeed from "@/components/landing/hyperspeed";
import DecryptedText from "@/components/landing/decrypted-text";
import MagnetButton from "@/components/landing/magnet-button";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative w-full min-h-screen bg-black text-white selection:bg-primary/30">
      {/* 3D Background - Fixed */}
      <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
        <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
          <Hyperspeed />
        </div>
      </Suspense>

      {/* Grid Overlay */}
      <div className="fixed inset-0 z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8 max-w-4xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-bold tracking-[0.2em] uppercase text-primary animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#00f2ff]" />
            System Online
          </div>

          {/* Hero Title */}
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/10">
            <DecryptedText
              text="NEXUS INTELLIGENCE"
              speed={100}
              maxIterations={20}
              className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
              animateOn="view"
              revealDirection="center"
            />
          </h1>

          <p className="text-sm md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-mono">
            Advanced neural interface for collaborative intelligence. 
            <br className="hidden md:block" />
            Seamlessly merge human intent with machine precision.
          </p>

          {/* Actions */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
            <MagnetButton
              className="group relative px-8 py-4 bg-primary text-black rounded-full font-bold tracking-widest uppercase text-xs hover:shadow-[0_0_40px_rgba(0,242,255,0.4)] transition-all overflow-hidden"
              onClick={() => router.push("/chat")}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                Initialize Stream <ArrowRight className="w-4 h-4" />
              </span>
            </MagnetButton>
            
            <button 
              onClick={() => window.open("https://github.com", "_blank")}
              className="px-8 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md text-xs font-bold tracking-widest uppercase transition-all hover:border-white/30"
            >
              System Docs
            </button>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-9 rounded-full border border-white/20 flex justify-center pt-2">
            <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Architecture Grid */}
      <section className="relative z-20 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">SYSTEM ARCHITECTURE</h2>
            <div className="h-1 w-20 bg-primary mb-6" />
            <p className="text-white/50 max-w-xl text-sm md:text-base font-mono">
              Deployed on edge networks with high-fidelity neural processing units. 
              Designed for speed, security, and scalability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: <GitBranch className="w-8 h-8 text-primary" />, 
                title: "Version Control", 
                desc: "Branch, merge, and checkpoint your neural conversations like code." 
              },
              { 
                icon: <Database className="w-8 h-8 text-secondary" />, 
                title: "Memory Vault", 
                desc: "Persistent long-term memory storage for contextual recall across sessions." 
              },
              { 
                icon: <Layers className="w-8 h-8 text-accent" />, 
                title: "Multi-Model", 
                desc: "Seamlessly switch between Gemini 2.0 Flash, Pro, and custom fine-tunes." 
              },
              { 
                icon: <Share2 className="w-8 h-8 text-white" />, 
                title: "Real-time Sync", 
                desc: "Collaborate with team members in real-time with sub-50ms latency." 
              },
              { 
                icon: <Shield className="w-8 h-8 text-primary" />, 
                title: "Enterprise Grade", 
                desc: "AES-256 encryption at rest and TLS 1.3 in transit for all neural data." 
              },
              { 
                icon: <Terminal className="w-8 h-8 text-secondary" />, 
                title: "CLI Integration", 
                desc: "Full command-line interface for headless operation and automation." 
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="group p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-white/10 backdrop-blur-sm hover:bg-white/[0.05] transition-all"
              >
                <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Stats */}
      <section className="relative z-20 py-32 px-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-8">
              NEURAL <span className="text-primary">UPLINK</span> STATUS
            </h2>
            <div className="space-y-8">
              {[
                { label: "Active Nodes", val: "8,421", color: "bg-primary" },
                { label: "Tokens Processed", val: "14.2B", color: "bg-secondary" },
                { label: "Uptime", val: "99.99%", color: "bg-accent" },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold tracking-[0.2em] text-white/50">
                    <span>{stat.label.toUpperCase()}</span>
                    <span>{stat.val}</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 1.5, delay: i * 0.2, ease: "circOut" }}
                      className={`h-full ${stat.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-6 rounded-2xl border border-white/10 bg-white/5 font-mono text-xs text-white/60">
              <div className="flex gap-2 mb-2">
                <span className="text-primary">$</span>
                <span>initializing secure handshake...</span>
              </div>
              <div className="flex gap-2 mb-2">
                <span className="text-primary">$</span>
                <span>verifying biometric credentials...</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary">$</span>
                <span className="animate-pulse">access granted_</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-[100px] rounded-full" />
            <div className="relative glass-panel p-8 rounded-[40px] border-white/10">
              <div className="aspect-square rounded-[32px] overflow-hidden relative group">
                <img 
                  src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" 
                  alt="Neural Core" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-[10px] font-black tracking-[0.2em] text-primary mb-2">OPERATIVE_VIEW</div>
                  <div className="text-lg font-bold leading-tight">
                    "The interface is seamless. It feels less like a tool and more like an extension of my own thought process."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 py-12 px-6 border-t border-white/10 text-center">
        <div className="text-white/20 text-[10px] font-black tracking-[0.3em] uppercase mb-4">
          NEXUS INTELLIGENCE SYSTEMS © 2026
        </div>
        <div className="flex justify-center gap-6 text-xs font-bold text-white/40">
          <a href="#" className="hover:text-primary transition-colors">PROTOCOL</a>
          <a href="#" className="hover:text-primary transition-colors">SECURITY</a>
          <a href="#" className="hover:text-primary transition-colors">STATUS</a>
        </div>
      </footer>
    </div>
  );
}