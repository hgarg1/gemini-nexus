"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Play, Star, MessageSquare, Plus, Download } from "lucide-react";
import { NexusButton, StaggerContainer, StaggerItem, DecodingText, NexusCard } from "@/components/ui/nexus-ui";

interface BotDetailViewProps {
  botId: string;
  onBack: () => void;
  onStartChat: (botId: string) => void;
}

export function BotDetailView({ botId, onBack, onStartChat }: BotDetailViewProps) {
  const [bot, setBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const fetchBot = async () => {
      try {
        const res = await fetch(`/api/bots/${botId}`);
        const data = await res.json();
        setBot(data.bot);
        setReviews(data.bot.reviews || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBot();
  }, [botId]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
        const res = await fetch(`/api/bots/${botId}/install`, { method: "POST" });
        if (res.ok) alert("Agent installed to your library.");
        else alert("Installation failed.");
    } catch (e) {
        console.error(e);
    } finally {
        setInstalling(false);
    }
  };

  const submitReview = async () => {
    if (!newReview.comment.trim()) return;
    try {
        const res = await fetch(`/api/bots/${botId}/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newReview)
        });
        const data = await res.json();
        if (data.review) {
            setReviews([data.review, ...reviews]);
            setNewReview({ rating: 5, comment: "" });
        }
    } catch (e) {
        console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-cyan-400 font-mono animate-pulse">Scanning Neural Pattern...</div>;
  if (!bot) return <div className="p-8 text-red-400 font-mono">Signal Lost. Agent not found.</div>;

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
      <StaggerContainer className="space-y-8">
        
        {/* Header */}
        <StaggerItem>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>RETURN_TO_GRID</span>
            </button>
            
            <div className="flex items-start gap-6">
                <div 
                    className="w-24 h-24 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                    style={{ 
                        backgroundColor: `${bot.appearance?.themeColor || '#00F2FF'}20`,
                        borderColor: `${bot.appearance?.themeColor || '#00F2FF'}40`
                    }}
                >
                    {/* Placeholder for Avatar */}
                    <div className="text-4xl">🤖</div>
                </div>
                
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                        <DecodingText text={bot.name.toUpperCase()} />
                    </h1>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-bold">{bot.avgRating?.toFixed(1) || "N/A"}</span>
                            <span className="text-white/30 text-xs">({bot.reviewCount} reviews)</span>
                        </div>
                        <div className="flex gap-2">
                            {bot.tags?.map((tag: string) => (
                                <span key={tag} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/50 uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <p className="text-white/70 max-w-2xl leading-relaxed">{bot.description}</p>
                </div>

                <div className="flex flex-col gap-3">
                    <NexusButton onClick={() => onStartChat(bot.id)} icon={Play}>
                        ENGAGE_SYSTEM
                    </NexusButton>
                    <NexusButton onClick={handleInstall} variant="secondary" icon={Download}>
                        {installing ? "DOWNLOADING..." : "INSTALL_TO_LIB"}
                    </NexusButton>
                </div>
            </div>
        </StaggerItem>

        {/* Stats Grid */}
        <StaggerItem className="grid grid-cols-3 gap-4">
            <NexusCard className="p-4 bg-black/40">
                <div className="text-xs text-white/40 font-bold uppercase mb-1">Total Interactions</div>
                <div className="text-2xl text-white font-mono">{bot.usage?.interactionCount || 0}</div>
            </NexusCard>
            <NexusCard className="p-4 bg-black/40">
                <div className="text-xs text-white/40 font-bold uppercase mb-1">Creator</div>
                <div className="text-xl text-white font-mono truncate">User #{bot.creatorId.slice(-4)}</div>
            </NexusCard>
            <NexusCard className="p-4 bg-black/40">
                <div className="text-xs text-white/40 font-bold uppercase mb-1">Status</div>
                <div className="text-xl text-green-400 font-mono tracking-wider">OPERATIONAL</div>
            </NexusCard>
        </StaggerItem>

        {/* Reviews Section */}
        <StaggerItem className="space-y-6 pt-8 border-t border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                USER_FEEDBACK_LOGS
            </h2>

            {/* Review Form */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })}>
                            <Star className={`w-5 h-5 ${star <= newReview.rating ? "text-yellow-400 fill-current" : "text-white/20"}`} />
                        </button>
                    ))}
                </div>
                <textarea 
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Submit observation report..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-cyan-500/50"
                />
                <button 
                    onClick={submitReview}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors"
                >
                    TRANSMIT_REVIEW
                </button>
            </div>

            {/* Review List */}
            <div className="space-y-4">
                {reviews.map(review => (
                    <div key={review.id} className="p-4 rounded-xl bg-black/20 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/10" />
                                <span className="text-sm font-medium text-white">{review.user?.name || "Unknown Operative"}</span>
                            </div>
                            <div className="flex text-yellow-400">
                                {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                            </div>
                        </div>
                        <p className="text-white/60 text-sm">{review.comment}</p>
                    </div>
                ))}
            </div>
        </StaggerItem>

      </StaggerContainer>
    </div>
  );
}
