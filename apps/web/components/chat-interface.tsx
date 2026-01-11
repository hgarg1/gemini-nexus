"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Settings2, 
  ChevronLeft,
  Activity,
  Cpu,
  Shield,
  Zap,
  GitBranch,
  ExternalLink,
  Terminal as TerminalIcon,
  FilePlus,
  User,
  X as CloseIcon,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "../lib/utils";
import { ImpressiveModal } from "./impressive-modal";

// New Components
import { ChatDock } from "./chat/chat-dock";
import { ChatSidebar } from "./chat/chat-sidebar";
import { SettingsPanel } from "./chat/settings-panel";
import { ImageViewer } from "./chat/image-viewer";
import { VersionView } from "./chat/views/version-view";
import { MemoryView } from "./chat/views/memory-view";
import { ShareModal } from "./chat/modals/share-modal";
import { CheckpointModal } from "./chat/modals/checkpoint-modal";
import { BranchModal } from "./chat/modals/branch-modal";
import { MergeModal } from "./chat/modals/merge-modal";
import { MergeConfirmModal } from "./chat/modals/merge-confirm-modal";
import { RestoreModal } from "./chat/modals/restore-modal";
import { DashboardStat } from "./chat/ui/dashboard-stat";

export default function ChatInterface({ chatId }: { chatId?: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [status, setStatus] = useState("IDLE");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [expandedImageGroups, setExpandedImageGroups] = useState<Record<string, boolean>>({});
  const [models, setModelsList] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("models/gemini-2.0-flash");
  const [isModelMenuOpen, setIsModelModelMenuOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [config, setConfig] = useState({
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 2048,
    customKey: "",
    modelName: "models/gemini-2.0-flash",
  });

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [fileMeta, setFileMeta] = useState<{ width: number; height: number; ratio: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [modelHighlightIndex, setModelHighlightIndex] = useState(-1);
  const [viewerState, setViewerState] = useState<{ images: string[]; index: number } | null>(null);
  const [assetFilter, setAssetFilter] = useState({
    ratio: "all",
    role: "all",
    label: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "grid" | "users" | "assets" | "memory" | "version">("chat");
  const [shareUrl, setShareUrl] = useState("");
  const [memories, setMemories] = useState<any[]>([]);
  const [memorySearch, setMemorySearch] = useState("");
  const [memorySort, setMemorySort] = useState("recent");
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [memoryLabelDraft, setMemoryLabelDraft] = useState("");
  const [memoryDeleteId, setMemoryDeleteId] = useState<string | null>(null);
  const [versionBranches, setVersionBranches] = useState<any[]>([]);
  const [versionCheckpoints, setVersionCheckpoints] = useState<any[]>([]);
  const [versionMergeRequests, setVersionMergeRequests] = useState<any[]>([]);
  const [versionLoading, setVersionLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const [selectedMergeRequestId, setSelectedMergeRequestId] = useState<string | null>(null);
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [checkpointLabel, setCheckpointLabel] = useState("");
  const [checkpointComment, setCheckpointComment] = useState("");
  const [checkpointBranchId, setCheckpointBranchId] = useState<string | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchBaseId, setBranchBaseId] = useState<string | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeTitle, setMergeTitle] = useState("");
  const [mergeDescription, setMergeDescription] = useState("");
  const [mergeSourceBranchId, setMergeSourceBranchId] = useState<string | null>(null);
  const [mergeTargetBranchId, setMergeTargetBranchId] = useState<string | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState("squash");
  const [checkpointEditingId, setCheckpointEditingId] = useState<string | null>(null);
  const [checkpointCommentDraft, setCheckpointCommentDraft] = useState("");
  const [mergeCommentDraft, setMergeCommentDraft] = useState("");
  const [isMergeConfirmOpen, setIsMergeConfirmOpen] = useState(false);
  const [mergeConfirmId, setMergeConfirmId] = useState<string | null>(null);
  const [mergeStrategyOptions, setMergeStrategyOptions] = useState<string[]>([]);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreCheckpointId, setRestoreCheckpointId] = useState<string | null>(null);
  const [restoreBranchId, setRestoreBranchId] = useState<string | null>(null);
  const [restoreStrategy, setRestoreStrategy] = useState("squash");
  const [restoreStrategyOptions, setRestoreStrategyOptions] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileFeedback, setCompileFeedback] = useState<{ isOpen: boolean; description: string }>(
    {
      isOpen: false,
      description: "",
    }
  );

  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string | null }>(
    {
      isOpen: false,
      id: null
    }
  );

  const [errorModalState, setErrorModalState] = useState<{ isOpen: boolean; title: string; description: string }>(
    {
      isOpen: false,
      title: "",
      description: ""
    }
  );

  const showError = (title: string, description: string) => {
    setErrorModalState({ isOpen: true, title, description });
  };

  const normalizeMessageAssets = (message: any) => {
    const output: any[] = [];
    const seen = new Set<string>();

    if (Array.isArray(message?.assets)) {
      message.assets.forEach((asset: any) => {
        const url = typeof asset === "string" ? asset : asset?.url;
        if (typeof url === "string" && !seen.has(url)) {
          const safeAsset = typeof asset === "object" && asset !== null ? asset : {};
          output.push({
            ...safeAsset,
            url,
            role: asset?.role ?? message?.role,
            ratio: asset?.ratio ?? "unknown",
            labels: asset?.labels ?? [],
          });
          seen.add(url);
        }
      });
    }

    if (Array.isArray(message?.images)) {
      message.images.forEach((img: string) => {
        if (typeof img === "string" && !seen.has(img)) {
          output.push({
            url: img,
            role: message?.role,
            ratio: "unknown",
            labels: [],
          });
          seen.add(img);
        }
      });
    }

    return output;
  };

  const getImageMaxHeight = (count: number) => {
    if (count <= 1) return 300;
    if (count === 2) return 260;
    if (count <= 4) return 230;
    return 200;
  };

  const openViewer = (images: string[], index: number) => {
    if (!images.length) return;
    const safeIndex = Math.max(0, Math.min(index, images.length - 1));
    setViewerState({ images, index: safeIndex });
  };

  const closeViewer = () => setViewerState(null);

  const shiftViewer = (direction: number) => {
    setViewerState((prev) => {
      if (!prev) return prev;
      const nextIndex = (prev.index + direction + prev.images.length) % prev.images.length;
      return { ...prev, index: nextIndex };
    });
  };

  const toggleImageGroup = (id: string) => {
    setExpandedImageGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Extract all assets from chat
  const allAssets = messages.reduce((acc: any[], m) => {
    normalizeMessageAssets(m).forEach((asset) => acc.push(asset));
    return acc;
  }, []);

  const filteredAssets = allAssets.filter((a: any) => {
    if (assetFilter.ratio !== "all" && a.ratio !== assetFilter.ratio) return false;
    if (assetFilter.role !== "all" && a.role !== assetFilter.role) return false;
    if (assetFilter.label && !a.labels?.some((l: string) => l.includes(assetFilter.label.toLowerCase()))) return false;
    return true;
  });

  const availableLabels = Array.from(new Set(allAssets.flatMap((a: any) => a.labels || []))).slice(0, 15);

  const toggleLabel = (label: string) => {
    setAssetFilter(prev => ({
      ...prev,
      label: prev.label === label ? "" : label
    }));
  };

  const resetAssetFilters = () => {
    setAssetFilter({ ratio: "all", role: "all", label: "" });
  };

  const readImageFile = (file: File) =>
    new Promise<{ preview: string; meta: { width: number; height: number; ratio: string } }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const ratio =
            img.width === img.height ? "square" : img.width > img.height ? "landscape" : "portrait";
          resolve({ preview, meta: { width: img.width, height: img.height, ratio } });
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = preview;
      };
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    const images = files.filter((file) => file.type.startsWith("image/"));

    if (images.length !== files.length) {
      showError("FILE_REJECTED", "Only visual neural data (images) can be analyzed in this stream version.");
    }

    if (images.length === 0) return;

    try {
      const results = await Promise.all(images.map(readImageFile));
      setFilePreviews((prev) => [...prev, ...results.map((result) => result.preview)]);
      setFileMeta((prev) => [...prev, ...results.map((result) => result.meta)]);
    } catch (err) {
      showError("FILE_READ_FAILURE", "Neural upload failed during decode. Try again.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
  
    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };
  
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files || []);
      handleFiles(files);
    };
  
    const clearFile = () => {
    setFilePreviews([]);
    setFileMeta([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFileAt = (index: number) => {
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    setFileMeta((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    setProfileImage(session?.user?.image ?? null);
    setProfileName(session?.user?.name ?? null);
  }, [session?.user?.image, session?.user?.name]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let isActive = true;

    const syncProfile = async () => {
      try {
        const res = await fetch("/api/user", { cache: "no-store" });
        const data = await res.json();
        if (!isActive || !res.ok || !data.user) return;

        setProfileImage(data.user.image ?? null);
        setProfileName(data.user.name ?? null);
      } catch (err) {
        console.warn("PROFILE_SYNC_FAILED");
      }
    };

    syncProfile();

    return () => {
      isActive = false;
    };
  }, [sessionStatus]);

  // Initialize Socket
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3006";
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(">> SOCKET_LINK_ESTABLISHED");
    });

    socket.on("user-typing", ({ userId, userName }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: userName }));
    });

    socket.on("user-stop-typing", ({ userId }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on("message-received", (message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("message-updated", (data) => {
      setMessages(prev => prev.map(m => m.id === data.id ? { ...m, content: data.content } : m));
      setStatus("IDLE");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join chat room when chatId changes
  useEffect(() => {
    if (chatId && socketRef.current) {
      socketRef.current.emit("join-chat", chatId);
    }
  }, [chatId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    if (socketRef.current && chatId && session?.user) {
      socketRef.current.emit("typing", { 
        chatId, 
        userId: (session.user as any).id, 
        userName: profileName || session.user.name 
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("stop-typing", { 
          chatId, 
          userId: (session.user as any).id 
        });
      }, 2000);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.chats) setHistory(data.chats);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  const fetchMemories = async () => {
    setMemoryLoading(true);
    try {
      const res = await fetch("/api/memory", { cache: "no-store" });
      const data = await res.json();
      if (data.memories) setMemories(data.memories);
    } catch (err) {
      console.error("Failed to fetch memories");
    } finally {
      setMemoryLoading(false);
    }
  };

  const persistChatConfig = async (nextConfig: typeof config) => {
    if (!chatId) return;
    try {
      await fetch(`/api/chat/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: nextConfig }),
      });
    } catch (err) {
      console.error("Failed to persist chat config");
    }
  };

  const fetchVersionData = async () => {
    if (!chatId) return null;
    setVersionLoading(true);
    try {
      const res = await fetch(`/api/version?chatId=${chatId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.branches) setVersionBranches(data.branches);
      if (data.checkpoints) setVersionCheckpoints(data.checkpoints);
      if (data.mergeRequests) setVersionMergeRequests(data.mergeRequests);
      if (!selectedBranchId && data.branches?.length) {
        const master = data.branches.find((branch: any) => branch.name === "master");
        setSelectedBranchId(master?.id || data.branches[0].id);
      }
      return data;
    } catch (err) {
      console.error("Failed to fetch version data");
    } finally {
      setVersionLoading(false);
    }
    return null;
  };

  const resolveBranchId = async () => {
    if (selectedBranchId) return selectedBranchId;
    if (versionBranches.length > 0) {
      return versionBranches.find((branch: any) => branch.name === "master")?.id || versionBranches[0]?.id || null;
    }
    const data = await fetchVersionData();
    const branches = data?.branches || [];
    return branches.find((branch: any) => branch.name === "master")?.id || branches[0]?.id || null;
  };

  const getCheckpointChainIds = (startId: string | null) => {
    const ids = new Set<string>();
    if (!startId) return ids;
    const lookup = new Map(versionCheckpoints.map((checkpoint: any) => [checkpoint.id, checkpoint]));
    let currentId: string | null = startId;
    while (currentId) {
      if (ids.has(currentId)) break;
      ids.add(currentId);
      currentId = lookup.get(currentId)?.parentId || null;
    }
    return ids;
  };

  const createNewChat = async () => {
    setStatus("INITIALIZING_NEW_LINK");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Nexus Stream", config }),
      });
      const data = await res.json();
      if (data.chat) {
        router.push(`/chat/${data.chat.id}`);
        fetchHistory();
      }
    } catch (err) {
      showError("SESSION_INIT_FAILURE", "Unable to establish a new neural stream with the Nexus core. Check uplink stability.");
    } finally {
      setStatus("IDLE");
    }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalState({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteModalState.id;
    if (!id) return;
    try {
      await fetch(`/api/chat/${id}`, { method: "DELETE" });
      if (chatId === id) router.push("/chat");
      fetchHistory();
    } catch (err) {
      showError("ERASURE_FAILURE", "The requested neural stream could not be purged from the vault. Security lock active?");
    }
  };

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(id);
    setEditTitle(currentTitle);
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      await fetch(`/api/chat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
      setEditingChatId(null);
      fetchHistory();
    } catch (err) {
      showError("RENAME_FAILURE", "Protocol error while updating stream designation. Access denied or link lost.");
    }
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        if (data.models) {
          setModelsList(data.models);
        }
      } catch (err) {
        console.error("Failed to fetch models");
      }
    };
    if (sessionStatus === "authenticated") {
      fetchModels();
      fetchHistory();
    }
  }, [sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && activeTab === "memory") {
      fetchMemories();
    }
  }, [sessionStatus, activeTab, messages]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && activeTab === "version") {
      fetchVersionData();
    }
  }, [sessionStatus, activeTab, chatId]);

  useEffect(() => {
    if (chatId && sessionStatus === "authenticated") {
      const fetchChat = async () => {
        setStatus("LOADING_HISTORY");
        setMessages([]); // Clear current messages while loading new chat
        try {
          const res = await fetch(`/api/chat/${chatId}`);
          const data = await res.json();
          if (data.chat) {
            setMessages(data.chat.messages);
            const nextConfig = {
              temperature: 0.7,
              topP: 0.8,
              maxOutputTokens: 2048,
              customKey: "",
              modelName: selectedModel,
              ...(data.chat.config || {}),
            };
            setConfig(nextConfig);
            if (nextConfig.modelName) {
              setSelectedModel(nextConfig.modelName);
            }
          }
        } catch (err) {
          console.error("Failed to fetch chat history");
        } finally {
          setStatus("IDLE");
        }
      };
      fetchChat();
    } else if (!chatId) {
       setMessages([]);
    }
  }, [chatId, sessionStatus]);

  useEffect(() => {
    if (!chatId || sessionStatus !== "authenticated") return;
    if (!selectedBranchId) {
      fetchVersionData();
    }
  }, [chatId, sessionStatus, selectedBranchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setCheckpointCommentDraft("");
  }, [selectedCheckpointId]);

  useEffect(() => {
    setMergeCommentDraft("");
  }, [selectedMergeRequestId]);

  useEffect(() => {
    if (!viewerState) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowRight") shiftViewer(1);
      if (event.key === "ArrowLeft") shiftViewer(-1);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerState]);

  useEffect(() => {
    if (!isModelMenuOpen) {
      setModelSearch("");
      setModelHighlightIndex(-1);
    }
  }, [isModelMenuOpen]);

  if (sessionStatus === "loading") {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 animate-pulse mb-4">
          <TerminalIcon className="text-primary w-8 h-8" />
        </div>
        <div className="text-[10px] font-black tracking-[0.3em] text-primary/50 animate-pulse">CONNECTING_TO_NEXUS...</div>
      </div>
    );
  }

  if (!session) return null;

  const handleShare = async () => {
    if (!chatId) return;
    
    try {
      await fetch(`/api/chat/${chatId}/public`, { method: "PATCH" });
      const url = `${window.location.origin}/chat/${chatId}`;
      setShareUrl(url);
      setIsShareModalOpen(true);
    } catch (err) {
      showError("SHARE_LINK_FAILURE", "Protocol mismatch while exposing neural stream. Encryption bypass failed.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
    setIsModelModelMenuOpen(false);
    const nextConfig = { ...config, modelName };
    setConfig(nextConfig);
    void persistChatConfig(nextConfig);
  };

  const handleModelKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isModelMenuOpen) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setModelHighlightIndex((prev) => {
        const next = prev < 0 ? 0 : Math.min(prev + 1, visibleModels.length - 1);
        return next;
      });
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setModelHighlightIndex((prev) => {
        const next = prev < 0 ? visibleModels.length - 1 : Math.max(prev - 1, 0);
        return next;
      });
    }
    if (event.key === "Enter") {
      if (highlightedModel) {
        event.preventDefault();
        handleModelSelect(highlightedModel.name);
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsModelModelMenuOpen(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && filePreviews.length === 0) return;
    
    const promptValue = input;
    const fileData = filePreviews;
    const metadata = fileMeta;
    setStatus("PROCESSING");
    setInput("");
    clearFile();

    try {
      let activeChatId = chatId;

      // 1. Auto-create chat if it doesn't exist
      if (!activeChatId) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: promptValue.slice(0, 30) || "Image Transmission",
            config: { ...config, modelName: selectedModel }
          }),
        });
        const data = await res.json();
        if (data.chat) {
          activeChatId = data.chat.id;
          fetchHistory();
        } else {
          throw new Error("Failed to initialize stream");
        }
      }

      // Add user message to UI immediately (with image placeholder if present)
      const userMessage = {
        role: "user", 
        content: promptValue, 
        id: Date.now().toString(),
        hasAttachment: fileData.length > 0,
        assets: fileData.length
          ? fileData.map((url, idx) => ({
              url,
              role: "user",
              ratio: metadata[idx]?.ratio ?? "unknown",
              width: metadata[idx]?.width,
              height: metadata[idx]?.height,
              labels: [],
            }))
          : []
      };
      setMessages(prev => [...prev, userMessage]);

      // 2. Transmit message
      const res = await fetch("/api/chat/transmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptValue,
            chatId: activeChatId,
            images: fileData, // Base64 image data
            metadata,
            branchId: selectedBranchId,
            history: messages.map(m => ({
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: m.content }]
            })),
          config: {
            ...config,
            modelName: selectedModel
          }
        })
      });

      const data = await res.json();
      if (data.placeholderMessage) {
        setMessages(prev => [...prev, data.placeholderMessage]);
        
        if (!chatId && activeChatId) {
          router.push(`/chat/${activeChatId}`);
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "model", content: `!! TRANSMISSION_FAILURE: ${err.message}`, id: Date.now().toString() }]);
      setStatus("ERROR");
    }
  };

  const startMemoryRename = (memory: any) => {
    setEditingMemoryId(memory.id);
    setMemoryLabelDraft(memory.label || "");
  };

  const saveMemoryLabel = async (id: string) => {
    if (!memoryLabelDraft.trim()) {
      setEditingMemoryId(null);
      return;
    }
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: memoryLabelDraft }),
      });
      if (!res.ok) throw new Error("Failed to update memory label");
      await fetchMemories();
    } catch (err) {
      showError("MEMORY_UPDATE_FAILURE", "Unable to rename memory label. Try again.");
    } finally {
      setEditingMemoryId(null);
    }
  };

  const confirmMemoryDelete = async () => {
    if (!memoryDeleteId) return;
    try {
      const res = await fetch(`/api/memory/${memoryDeleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete memory");
      await fetchMemories();
    } catch (err) {
      showError("MEMORY_DELETE_FAILURE", "Unable to delete memory. Try again.");
    } finally {
      setMemoryDeleteId(null);
    }
  };

  const handleCreateCheckpoint = async (data?: { label: string, comment: string, branchId: string | null }) => {
    if (!chatId) return;
    const label = data?.label || checkpointLabel;
    const comment = data?.comment || checkpointComment;
    const targetBranchId = data?.branchId || checkpointBranchId;

    if (!label.trim()) return;

    try {
      if (checkpointEditingId) {
        const res = await fetch(`/api/version/checkpoint/${checkpointEditingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            comment,
          }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Checkpoint update failed");
      } else {
        const branchId = targetBranchId || (await resolveBranchId());
        if (!branchId) {
          showError("CHECKPOINT_FAILURE", "No branch selected for checkpoint.");
          return;
        }
        const res = await fetch("/api/version/checkpoint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            branchId,
            label,
            comment,
          }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Checkpoint failed");
      }
      setCheckpointLabel("");
      setCheckpointComment("");
      setCheckpointBranchId(null);
      setCheckpointEditingId(null);
      setIsCheckpointModalOpen(false);
      await fetchVersionData();
    } catch (err: any) {
      showError("CHECKPOINT_FAILURE", err.message || "Unable to save checkpoint.");
    }
  };

  const handleCreateBranch = async (data?: { name: string, baseCheckpointId: string | null }) => {
    if (!chatId) return;
    const name = data?.name || branchName;
    const baseId = data?.baseCheckpointId || branchBaseId;

    if (!name.trim()) return;
    try {
      const res = await fetch("/api/version/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          name,
          baseCheckpointId: baseId,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Branch failed");
      setBranchName("");
      setBranchBaseId(null);
      setIsBranchModalOpen(false);
      await fetchVersionData();
    } catch (err: any) {
      showError("BRANCH_FAILURE", err.message || "Unable to create branch.");
    }
  };

  const handleCreateMergeRequest = async (data?: { sourceBranchId: string | null, targetBranchId: string | null, title: string, description: string }) => {
    if (!chatId) return;
    const sourceId = data?.sourceBranchId || mergeSourceBranchId;
    const targetId = data?.targetBranchId || mergeTargetBranchId;
    const title = data?.title || mergeTitle;
    const description = data?.description || mergeDescription;

    if (!sourceId || !targetId || !title.trim()) return;
    if (sourceId === targetId) {
      showError("MERGE_REQUEST_FAILURE", "Source and target must be different branches.");
      return;
    }
    try {
      const res = await fetch("/api/version/merge-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          sourceBranchId: sourceId,
          targetBranchId: targetId,
          title,
          description,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Merge request failed");
      setMergeTitle("");
      setMergeDescription("");
      setMergeSourceBranchId(null);
      setMergeTargetBranchId(null);
      setIsMergeModalOpen(false);
      await fetchVersionData();
    } catch (err: any) {
      showError("MERGE_REQUEST_FAILURE", err.message || "Unable to open merge request.");
    }
  };

  const handleMerge = async (id: string, strategy: string = mergeStrategy) => {
    try {
      const res = await fetch(`/api/version/merge-request/${id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Merge failed");
      await fetchVersionData();
      setMergeConfirmId(null);
      setSelectedMergeRequestId(null);
    } catch (err: any) {
      showError("MERGE_FAILURE", err.message || "Unable to merge.");
    }
  };

  const handleCompileBranch = async (branchId: string | null) => {
    if (!chatId || !branchId) return;
    if (isCompiling) return;
    setIsCompiling(true);
    try {
      const res = await fetch("/api/version/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, branchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Compile failed");
      const description = `BRANCH_COMPILED\nHEAD_${data.headId?.slice(-6) || "N/A"}\nMESSAGES_${data.messageCount ?? 0}`;
      setCompileFeedback({ isOpen: true, description });
      await fetchVersionData();
    } catch (err: any) {
      showError("COMPILE_FAILURE", err.message || "Unable to compile branch.");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleAddCheckpointComment = async () => {
    if (!selectedCheckpointId || !checkpointCommentDraft.trim()) return;
    try {
      const res = await fetch(`/api/version/checkpoint/${selectedCheckpointId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: checkpointCommentDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comment failed");
      setCheckpointCommentDraft("");
      await fetchVersionData();
    } catch (err: any) {
      showError("COMMENT_FAILURE", err.message || "Unable to add checkpoint comment.");
    }
  };

  const handleAddMergeComment = async () => {
    if (!selectedMergeRequestId || !mergeCommentDraft.trim()) return;
    try {
      const res = await fetch(`/api/version/merge-request/${selectedMergeRequestId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: mergeCommentDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comment failed");
      setMergeCommentDraft("");
      await fetchVersionData();
    } catch (err: any) {
      showError("COMMENT_FAILURE", err.message || "Unable to add merge comment.");
    }
  };

  const handleRestoreCheckpoint = async (strategy: string = restoreStrategy) => {
    if (!chatId || !restoreCheckpointId || !restoreBranchId) return;
    try {
      const res = await fetch("/api/version/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          branchId: restoreBranchId,
          checkpointId: restoreCheckpointId,
          strategy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Restore failed");
      setIsRestoreModalOpen(false);
      setRestoreCheckpointId(null);
      await fetchVersionData();
    } catch (err: any) {
      showError("RESTORE_FAILURE", err.message || "Unable to restore checkpoint.");
    }
  };

  const openCheckpointModal = async (mode: "create" | "edit", checkpoint?: any) => {
    if (!chatId) {
      showError("CHECKPOINT_FAILURE", "No active stream to checkpoint.");
      return;
    }
    if (mode === "edit" && checkpoint) {
      setCheckpointEditingId(checkpoint.id);
      setCheckpointLabel(checkpoint.label || "");
      setCheckpointComment(checkpoint.comment || "");
      setCheckpointBranchId(checkpoint.branchId || null);
    } else {
      setCheckpointEditingId(null);
      setCheckpointLabel("");
      setCheckpointComment("");
      const resolvedBranchId = await resolveBranchId();
      setCheckpointBranchId(resolvedBranchId);
    }
    setIsCheckpointModalOpen(true);
  };

  const closeCheckpointModal = () => {
    setIsCheckpointModalOpen(false);
    setCheckpointEditingId(null);
    setCheckpointLabel("");
    setCheckpointComment("");
    setCheckpointBranchId(null);
  };

  const openMergeConfirm = (request: any) => {
    if (!request?.id) return;
    const sourceHeadId = request.sourceBranch?.headId || null;
    const targetHeadId = request.targetBranch?.headId || null;
    let options: string[] = [];
    if (sourceHeadId) {
      const chainIds = getCheckpointChainIds(sourceHeadId);
      const canFastForward = !targetHeadId || chainIds.has(targetHeadId);
      if (canFastForward) {
        options = ["fast-forward"];
      } else {
        options = ["squash", "rebase"];
      }
    }
    if (options.length === 0) options = ["squash"];
    setMergeStrategyOptions(options);
    setMergeStrategy(options[0] || "squash");
    setMergeConfirmId(request.id);
    setSelectedMergeRequestId(request.id);
    setIsMergeConfirmOpen(true);
  };

  const openRestoreModal = async (checkpointId: string) => {
    if (!checkpointId) return;
    const branchId = restoreBranchId || selectedBranchId || (await resolveBranchId());
    if (!branchId) {
      showError("RESTORE_FAILURE", "No branch available to restore.");
      return;
    }
    const branch = versionBranches.find((item: any) => item.id === branchId);
    const headId = branch?.headId || null;
    let options: string[] = [];
    if (!headId) {
      options = ["fast-forward"];
    } else {
      const chainIds = getCheckpointChainIds(headId);
      if (chainIds.has(checkpointId)) {
        options = ["fast-forward"];
      } else {
        options = ["squash", "rebase"];
      }
    }
    setRestoreBranchId(branchId);
    setRestoreCheckpointId(checkpointId);
    setRestoreStrategyOptions(options);
    setRestoreStrategy(options[0] || "squash");
    setIsRestoreModalOpen(true);
  };

  const currentModelData = models.find(m => m.name === selectedModel) || { displayName: "GEMINI-2.0-FLASH" };

  const branchOptions = versionBranches.length
    ? versionBranches.map((branch: any) => ({
        label: branch.name.toUpperCase(),
        value: branch.id,
      }))
    : [{ label: "NO_BRANCH", value: "" }];

  const checkpointById = new Map(versionCheckpoints.map((checkpoint: any) => [checkpoint.id, checkpoint]));
  const checkpointOptions = versionCheckpoints.length
    ? [
        { label: "NONE", value: "" },
        ...versionCheckpoints.map((checkpoint: any) => ({
          label: checkpoint.label.toUpperCase(),
          value: checkpoint.id,
        })),
      ]
    : [{ label: "NONE", value: "" }];

  const selectedCheckpoint = selectedCheckpointId
    ? checkpointById.get(selectedCheckpointId)
    : null;
  const selectedMergeRequest = selectedMergeRequestId
    ? versionMergeRequests.find((item: any) => item.id === selectedMergeRequestId)
    : null;
  const selectedRestoreCheckpoint = restoreCheckpointId
    ? checkpointById.get(restoreCheckpointId)
    : null;
  const mergeConfirmRequest = mergeConfirmId
    ? versionMergeRequests.find((item: any) => item.id === mergeConfirmId)
    : null;

  const visibleModels = (models.length > 0 ? models : [{ name: "models/gemini-2.0-flash", displayName: "Gemini 2.0 Flash" }])
    .filter((model) => {
      if (!modelSearch.trim()) return true;
      const query = modelSearch.toLowerCase();
      return (
        model.displayName?.toLowerCase().includes(query) ||
        model.name?.toLowerCase().includes(query)
      );
    });
  const highlightedModel = modelHighlightIndex >= 0 ? visibleModels[modelHighlightIndex] : null;

  const viewerImages = viewerState?.images ?? [];
  const viewerIndex = viewerState?.index ?? 0;

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col md:flex-row h-screen min-h-0 bg-background text-foreground overflow-hidden selection:bg-primary/30 relative"
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="p-12 rounded-[40px] border-2 border-dashed border-primary bg-black/60 shadow-[0_0_50px_rgba(0,242,255,0.2)] flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center text-primary animate-pulse">
                <FilePlus className="w-12 h-12" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black tracking-tighter text-primary uppercase">INJECT_NEURAL_DATA</h2>
                <p className="text-[10px] font-black tracking-[0.3em] text-white/40 mt-2 uppercase">RELEASE TO UPLOAD IMAGE</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatDock 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isShareOpen={isShareModalOpen}
        onShare={handleShare}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        isInfoOpen={isInfoModalOpen}
        onToggleInfo={() => setIsInfoModalOpen(!isInfoModalOpen)}
        onShowError={showError}
        isAdmin={(session?.user as any)?.role === "admin" || session?.user?.email === "admin@nexus.sh"}
      />

      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onNewChat={createNewChat}
        history={history}
        chatId={chatId}
        onDeleteChat={deleteChat}
        onStartRename={startRename}
        editingChatId={editingChatId}
        editTitle={editTitle}
        onEditTitleChange={setEditTitle}
        onFinishRename={handleRename}
        profile={{ image: profileImage, name: profileName }}
        onSignOut={() => signOut({ callbackUrl: window.location.origin + "/login" })}
        onOpenProfile={() => router.push("/settings")}
        assets={filteredAssets}
        assetFilter={assetFilter}
        onAssetFilterChange={setAssetFilter}
        availableLabels={availableLabels}
        onToggleLabel={toggleLabel}
        onOpenViewer={openViewer}
        onResetFilters={resetAssetFilters}
      />

      <main className="flex-1 min-h-0 flex flex-col relative z-10 pb-20 md:pb-0">
        {activeTab === "version" ? (
          <VersionView
            loading={versionLoading}
            branches={versionBranches}
            checkpoints={versionCheckpoints}
            mergeRequests={versionMergeRequests}
            selectedBranchId={selectedBranchId}
            onSelectBranch={setSelectedBranchId}
            selectedCheckpointId={selectedCheckpointId}
            onSelectCheckpoint={setSelectedCheckpointId}
            selectedMergeRequestId={selectedMergeRequestId}
            onSelectMergeRequest={setSelectedMergeRequestId}
            isCompiling={isCompiling}
            onCompile={handleCompileBranch}
            onOpenBranchModal={() => {
              setIsBranchModalOpen(true);
              setBranchBaseId(versionBranches.find((b: any) => b.id === selectedBranchId)?.headId || null);
            }}
            onOpenCheckpointModal={openCheckpointModal}
            onOpenMergeModal={(sourceId, targetId) => {
              setMergeSourceBranchId(sourceId);
              setMergeTargetBranchId(targetId);
              setIsMergeModalOpen(true);
            }}
            onOpenMergeConfirm={openMergeConfirm}
            onRestoreCheckpoint={openRestoreModal}
            checkpointCommentDraft={checkpointCommentDraft}
            onCheckpointCommentChange={setCheckpointCommentDraft}
            onSaveCheckpointComment={handleAddCheckpointComment}
            mergeCommentDraft={mergeCommentDraft}
            onMergeCommentChange={setMergeCommentDraft}
            onSaveMergeComment={handleAddMergeComment}
            currentModelName={currentModelData.displayName || selectedModel}
          />
        ) : activeTab === "memory" ? (
          <MemoryView
             memories={memories}
             loading={memoryLoading}
             search={memorySearch}
             onSearchChange={setMemorySearch}
             sort={memorySort}
             onSortChange={setMemorySort}
             editingId={editingMemoryId}
             labelDraft={memoryLabelDraft}
             onEditStart={startMemoryRename}
             onLabelChange={setMemoryLabelDraft}
             onSaveLabel={saveMemoryLabel}
             onDelete={setMemoryDeleteId}
          />
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-panel/40 backdrop-blur-md relative z-40">
          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-all"
            >
              <ChevronLeft className={cn("w-5 h-5 transition-transform", !isSidebarOpen && "rotate-180")} />
            </button>
            <div className="h-10 w-px bg-white/5 hidden md:block" />
            <div className="flex items-center gap-4 md:gap-8">
              <div className="hidden md:block">
                <DashboardStat icon={<Activity />} label="STATUS" value={status} color={status === "PROCESSING" ? "text-primary animate-pulse" : "text-primary"} />
              </div>
              <div className="relative">
                <div onClick={() => setIsModelModelMenuOpen(!isModelMenuOpen)} className="flex items-center gap-3 group cursor-pointer">
                  <div className={cn("p-2 rounded-lg bg-white/5 text-secondary transition-all", isModelMenuOpen && "bg-secondary/20 text-white shadow-[0_0_15px_rgba(112,0,255,0.3)]")}>
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-[9px] font-black text-white/20 tracking-[0.2em] hidden md:block">ENGINE_CORE</div>
                    <div className="text-xs font-black tracking-tight text-secondary group-hover:text-white transition-colors flex items-center gap-2">
                      {currentModelData.displayName?.split(' ').slice(0, 3).join(' ').toUpperCase() || "GEMINI-2.0"}
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-[0.2em] bg-secondary/20 text-secondary border border-secondary/30 hidden md:inline">
                        ACTIVE
                      </span>
                      <ChevronLeft className={cn("w-3 h-3 transition-transform", isModelMenuOpen ? "rotate-90" : "-rotate-90")} />
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {isModelMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 mt-4 w-72 glass-panel rounded-2xl border-white/10 overflow-hidden shadow-2xl z-50 p-2">
                      <div className="text-[10px] font-black text-white/20 tracking-widest p-3 border-b border-white/5 mb-2">AVAILABLE_ENGINES</div>
                      <div className="max-h-80 overflow-y-auto space-y-1">
                        <div className="px-3 pt-2 pb-3">
                          <div className="relative">
                            <input
                              value={modelSearch}
                              onChange={(e) => setModelSearch(e.target.value)}
                              onKeyDown={handleModelKeyDown}
                              placeholder="SEARCH_MODELS..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black tracking-[0.2em] uppercase outline-none focus:border-secondary/40"
                            />
                            {modelSearch && (
                              <button
                                type="button"
                                onClick={() => setModelSearch("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                              >
                                <CloseIcon className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        {visibleModels.map((m, idx) => (
                          <button key={m.name} onClick={() => handleModelSelect(m.name)} className={cn("w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group border", selectedModel === m.name ? "bg-secondary/20 border-secondary/30" : "border-transparent hover:bg-white/5", idx === modelHighlightIndex ? "bg-white/10 border-white/20" : "")}>
                            <div className={cn("mt-1 p-1.5 rounded-md bg-white/5 transition-colors", selectedModel === m.name ? "text-white" : "text-white/20 group-hover:text-secondary")}><Zap className="w-3.5 h-3.5" /></div>
                            <div>
                              <div className={cn("text-sm font-bold tracking-tight", selectedModel === m.name ? "text-white" : "text-white/60 group-hover:text-white")}>{m.displayName?.toUpperCase() || m.name.split('/').pop()?.toUpperCase()}</div>
                              <div className="text-[9px] font-medium text-white/20 uppercase line-clamp-1">{m.name.split('/').pop()}</div>
                            </div>
                          </button>
                        ))}
                        {visibleModels.length === 0 && (
                          <div className="px-4 py-6 text-center text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
                            NO_MODELS_FOUND
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="hidden md:block">
                <DashboardStat icon={<Shield />} label="SECURITY" value="ACTIVE" color="text-accent" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={handleShare} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"><ExternalLink className="w-3.5 h-3.5" />SHARE_NEXUS</button>
            <button
              onClick={() => openCheckpointModal("create")}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:scale-105 transition-all"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span className="hidden md:inline">CHECKPOINT</span>
            </button>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={cn("p-3 rounded-xl transition-all", isSettingsOpen ? "bg-primary text-black" : "bg-white/5 hover:bg-white/10")}><Settings2 className="w-5 h-5" /></button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-12 space-y-6 md:space-y-12">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => {
              const messageAssets = normalizeMessageAssets(m);
              const messageAssetUrls = messageAssets.map((asset) => asset.url);
              const messageKey = m.id || `msg-${i}`;
              const isExpanded = !!expandedImageGroups[messageKey];
              const maxPreview = 6;
              const displayAssets = isExpanded ? messageAssets : messageAssets.slice(0, maxPreview);
              const overflowCount = Math.max(messageAssets.length - displayAssets.length, 0);
              const imageMaxHeight = getImageMaxHeight(messageAssets.length);
              const gridColumns =
                displayAssets.length <= 1
                  ? "grid-cols-1"
                  : displayAssets.length === 2
                    ? "grid-cols-2"
                    : displayAssets.length === 3
                      ? "grid-cols-3"
                      : "grid-cols-2 md:grid-cols-3";

              return (
                <motion.div key={m.id || i} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={cn("flex gap-4 md:gap-6 max-w-5xl mx-auto group", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className="relative flex-shrink-0">
                    <div className={cn("w-9 h-9 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border shadow-2xl relative z-10 transition-all duration-500", m.role === "user" ? "bg-primary/10 border-primary/30 text-primary shadow-primary/5" : "bg-secondary/10 border-secondary/30 text-secondary shadow-secondary/5")}>
                      {m.role === "user" ? (profileImage ? <img src={profileImage} className="w-full h-full rounded-2xl object-cover" /> : <User className="w-5 h-5 md:w-6 md:h-6" />) : <Zap className="w-5 h-5 md:w-6 md:h-6" />}
                    </div>
                    <div className={cn("absolute inset-0 blur-2xl opacity-20 -z-0", m.role === "user" ? "bg-primary" : "bg-secondary")} />
                  </div>
                  <div className={cn("flex-1 flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-3 mb-3 px-2">
                      <span className={cn("text-[10px] font-black tracking-[0.2em]", m.role === "user" ? "text-primary/40" : "text-secondary/40")}>{m.role === "user" ? "AUTHOR_U_01" : "ENGINE_RESULT"}</span>
                      <span className="text-[9px] font-mono text-white/10">0x{Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
                    </div>
                    <div className={cn(
                      "relative p-4 md:p-7 rounded-[28px] md:rounded-[32px] border transition-all duration-500 max-w-full",
                      m.role === "user" 
                        ? "bg-white/[0.03] border-white/10 rounded-tr-none shadow-xl hover:border-primary/20" 
                        : "glass-panel border-white/5 rounded-tl-none shadow-2xl hover:border-secondary/20"
                    )}>
                      {messageAssets.length > 0 && (
                        <div className="mb-6 space-y-3">
                          <div className={cn(
                            "grid gap-3",
                            gridColumns,
                            isExpanded && messageAssets.length > maxPreview ? "max-h-[320px] overflow-y-auto pr-1" : ""
                          )}>
                            {displayAssets.map((asset: any, idx: number) => (
                              <motion.button
                                key={`${messageKey}-asset-${idx}`}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                onClick={() => {
                                  const assetIndex = messageAssetUrls.findIndex((url) => url === asset.url);
                                  openViewer(messageAssetUrls, assetIndex < 0 ? 0 : assetIndex);
                                }}
                                className="group relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                              >
                                <img
                                  src={asset.url}
                                  alt="Neural Attachment"
                                  className="w-full object-cover"
                                  style={{ maxHeight: `${imageMaxHeight}px` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {!isExpanded && overflowCount > 0 && idx === displayAssets.length - 1 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-black tracking-[0.3em] text-white/80">
                                    +{overflowCount} MORE
                                  </div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          {messageAssets.length > maxPreview && (
                            <button
                              type="button"
                              onClick={() => toggleImageGroup(messageKey)}
                              className="text-[10px] font-black tracking-[0.3em] text-white/30 hover:text-primary transition-colors uppercase"
                            >
                              {isExpanded ? "COLLAPSE_GRID" : `EXPAND_GRID_${messageAssets.length}`}
                            </button>
                          )}
                        </div>
                      )}

                      <div className="text-sm md:text-[17px] leading-relaxed text-white/90 font-medium tracking-tight markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                      <div className={cn("absolute top-0 transform -translate-y-1/2 px-3 py-1 rounded-full text-[8px] font-black tracking-[0.2em] border", m.role === "user" ? "right-6 bg-primary text-black border-primary/50" : "left-6 bg-secondary text-white border-secondary/50")}>{m.role.toUpperCase()}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {status === "PROCESSING" && (
            <div className="flex gap-6 max-w-5xl mx-auto items-center text-primary/40 text-xs font-black tracking-widest animate-pulse">
               <Activity className="w-4 h-4" /> INCOMING TRANSMISSION...
            </div>
          )}
          {Object.entries(typingUsers).length > 0 && (
            <div className="flex gap-6 max-w-5xl mx-auto items-center text-secondary/40 text-xs font-black tracking-widest">
               <div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:0.2s]" /><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:0.4s]" /></div>
               {Object.values(typingUsers).join(", ")} IS ENCODING...
            </div>
          )}
        </div>

        <div className="px-4 md:px-8 pb-6 md:pb-10">
          <div className="max-w-5xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-[2rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative glass-panel rounded-[2rem] p-3 border-white/10 focus-within:border-primary/30 transition-all duration-500">
              {filePreviews.length > 0 && (
                <div className="px-4 pt-4 pb-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase">
                      UPLOAD_QUEUE_{filePreviews.length}
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="text-[10px] font-black tracking-[0.3em] text-white/20 hover:text-accent transition-colors uppercase"
                    >
                      CLEAR_ALL
                    </button>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-32 overflow-y-auto pr-1">
                    {filePreviews.map((preview, idx) => (
                      <div key={`${preview}-${idx}`} className="relative group/file">
                        <img src={preview} className="w-full h-20 rounded-xl object-cover border border-white/10" />
                        <button
                          type="button"
                          onClick={() => removeFileAt(idx)}
                          className="absolute -top-2 -right-2 bg-accent text-white rounded-full p-1 opacity-0 group-hover/file:opacity-100 transition-opacity shadow-lg"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2 md:gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />
                <button onClick={() => fileInputRef.current?.click()} className="p-4 text-white/20 hover:text-primary transition-colors"><FilePlus className="w-6 h-6" /></button>
                <textarea rows={1} value={input} onChange={handleInputChange} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Enter command sequence..." className="flex-1 bg-transparent border-none focus:ring-0 p-3 md:p-4 max-h-60 resize-none text-base md:text-xl font-medium placeholder:text-white/10 scroll-py-4" />
                <button onClick={handleSend} disabled={(!input.trim() && filePreviews.length === 0) || status === "PROCESSING"} className="w-12 h-12 md:w-14 md:h-14 bg-primary text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 shadow-lg shadow-primary/20"><Send className="w-5 h-5 md:w-6 md:h-6" /></button>
              </div>
            </div>
          </div>
        </div>
          </motion.div>
        )}
      </main>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        setConfig={(newConfig) => {
           setConfig(newConfig);
           persistChatConfig(newConfig);
        }}
      />

      <ImpressiveModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        type="info"
        title="SYSTEM_DIAGNOSTICS"
        description={`Nexus Core: 2.0.0\nUplink: STABLE\nNeural Engine: ${selectedModel.toUpperCase()}\nLatency: 142ms\nRegion: US-NORTH-1`}
        confirmText="REFRESH_SYNC"
        cancelText="CLOSE_LOG"
      />

      <ImpressiveModal 
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        type="danger"
        title="NEURAL_PURGE_CONFIRMATION"
        description="WARNING: This sequence will permanently erase this neural stream and all associated data from the Nexus vault. This action is irreversible."
        confirmText="ERASE_STREAM"
        cancelText="ABORT_PURGE"
      />

      <ImpressiveModal 
        isOpen={errorModalState.isOpen}
        onClose={() => setErrorModalState({ ...errorModalState, isOpen: false })}
        type="danger"
        title={errorModalState.title}
        description={errorModalState.description}
        confirmText="ACKNOWLEDGE"
        cancelText="DISMISS"
      />

      <ImpressiveModal
        isOpen={compileFeedback.isOpen}
        onClose={() => setCompileFeedback({ isOpen: false, description: "" })}
        type="success"
        title="COMPILE_COMPLETE"
        description={compileFeedback.description}
        confirmText="ACKNOWLEDGE"
        cancelText="CLOSE_LOG"
      />

      <ImpressiveModal 
        isOpen={!!memoryDeleteId}
        onClose={() => setMemoryDeleteId(null)}
        onConfirm={confirmMemoryDelete}
        type="danger"
        title="MEMORY_ERASURE_CONFIRMATION"
        description="WARNING: This memory will be permanently removed from your vault and can only be restored by re-capturing it."
        confirmText="ERASE_MEMORY"
        cancelText="ABORT"
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareUrl}
      />

      <CheckpointModal
        isOpen={isCheckpointModalOpen}
        onClose={closeCheckpointModal}
        onSubmit={handleCreateCheckpoint}
        editingCheckpoint={
          checkpointEditingId
            ? {
                id: checkpointEditingId,
                label: checkpointLabel,
                comment: checkpointComment,
                branchId: checkpointBranchId || undefined,
              }
            : null
        }
        branches={branchOptions}
        defaultBranchId={checkpointBranchId}
      />

      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onSubmit={handleCreateBranch}
        checkpoints={checkpointOptions}
        defaultBaseId={branchBaseId}
      />

      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onSubmit={handleCreateMergeRequest}
        branches={branchOptions}
        defaultSourceId={mergeSourceBranchId}
        defaultTargetId={mergeTargetBranchId}
      />

      <MergeConfirmModal
        isOpen={isMergeConfirmOpen}
        onClose={() => setIsMergeConfirmOpen(false)}
        request={mergeConfirmRequest}
        strategyOptions={mergeStrategyOptions}
        onConfirm={handleMerge}
      />

      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        checkpoint={selectedRestoreCheckpoint}
        branchName={
          versionBranches.find((b: any) => b.id === restoreBranchId)?.name ||
          "UNKNOWN"
        }
        strategyOptions={restoreStrategyOptions}
        onConfirm={handleRestoreCheckpoint}
      />

      <ImageViewer
        isOpen={!!viewerState}
        onClose={closeViewer}
        images={viewerState?.images || []}
        index={viewerState?.index || 0}
        onIndexChange={(index) =>
          setViewerState((prev) => (prev ? { ...prev, index } : null))
        }
      />

    </div>
  );
}