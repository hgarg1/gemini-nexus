"use client";

import React, { useState, useEffect } from "react";
import { Bot, Trash2, Shield, Search, Zap } from "lucide-react";

export default function AdminBotsPage() {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBots = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/bots");
      const data = await res.json();
      if (data.bots) setBots(data.bots);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const handleDelete = async (botId: string) => {
    if (!confirm("Are you sure you want to force delete this bot?")) return;
    try {
        const res = await fetch(`/api/bots/${botId}`, { method: "DELETE" });
        if (res.ok) {
            setBots(bots.filter(b => b.id !== botId));
        }
    } catch (e) { console.error(e); }
  };

  const filteredBots = bots.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.creator?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Bot className="w-6 h-6 text-primary" />
                GLOBAL BOTS REGISTRY
            </h1>
            <p className="text-white/50">Monitor and manage all custom agents across the system.</p>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
                type="text" 
                placeholder="Search bots or creators..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 w-64"
            />
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50 font-medium">
                <tr>
                    <th className="p-4">IDENTITY</th>
                    <th className="p-4">CREATOR</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">USAGE (TOKENS)</th>
                    <th className="p-4 text-right">ACTIONS</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-white/30">Scanning Registry...</td></tr>
                ) : filteredBots.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-white/30">No active agents found.</td></tr>
                ) : (
                    filteredBots.map(bot => (
                        <tr key={bot.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{bot.name}</div>
                                        <div className="text-xs text-white/40">{bot.description?.substring(0, 30)}...</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    {bot.creator?.image && (
                                        <img src={bot.creator.image} className="w-5 h-5 rounded-full" />
                                    )}
                                    <span className="text-white/70">{bot.creator?.name || bot.creator?.email}</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                    bot.status === "PUBLISHED" 
                                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                }`}>
                                    {bot.status}
                                </span>
                            </td>
                            <td className="p-4 font-mono text-white/60">
                                {bot.usage?.tokenCount?.toLocaleString() || 0}
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleDelete(bot.id)}
                                    className="p-2 hover:bg-red-500/20 rounded text-red-500/50 hover:text-red-500 transition-colors"
                                    title="Force Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
