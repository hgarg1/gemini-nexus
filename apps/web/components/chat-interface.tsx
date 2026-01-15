"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
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
  SmilePlus
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "../lib/utils";
import { ImpressiveModal } from "./impressive-modal";
import { defaultChatPolicy, defaultChatOrgOverride } from "@/lib/chat-policy";

// New Components
import { ChatDock } from "./chat/chat-dock";
import { ChatSidebar } from "./chat/chat-sidebar";
import { SettingsPanel } from "./chat/settings-panel";
import { ImageViewer } from "./chat/image-viewer";
import { VersionView } from "./chat/views/version-view";
import { MemoryView } from "./chat/views/memory-view";
import { CollaborationView } from "./chat/views/collaboration-view";
import { ShareModal } from "./chat/modals/share-modal";
import { CheckpointModal } from "./chat/modals/checkpoint-modal";
import { BranchModal } from "./chat/modals/branch-modal";
import { MergeModal } from "./chat/modals/merge-modal";
import { MergeConfirmModal } from "./chat/modals/merge-confirm-modal";
import { RestoreModal } from "./chat/modals/restore-modal";
import { NexusHubView } from "./chat/views/nexus-hub-view";
import { DashboardStat } from "./chat/ui/dashboard-stat";
import { UserSelectionModal } from "./chat/modals/user-selection-modal";
import { CreateSquadModal } from "./chat/modals/create-squad-modal";
import { CreateDMModal } from "./chat/modals/create-dm-modal";
import { TypingWaveform } from "./chat/ui/typing-waveform";
import { synth } from "@/lib/audio-synth";

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
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
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
  const [collabTab, setCollabTab] = useState<"links" | "participants" | "messages" | "directory" | "notifications">("links");
  const [collabLinks, setCollabLinks] = useState<any[]>([]);
  const [collabLinksLoading, setCollabLinksLoading] = useState(false);
  const [collabOwner, setCollabOwner] = useState<any | null>(null);
  const [collabParticipants, setCollabParticipants] = useState<any[]>([]);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directoryUsers, setDirectoryUsers] = useState<any[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [allowedSquadSettings, setAllowedSquadSettings] = useState<string[]>(["isPublic", "allowInvites", "description"]);
  const [directThreadUser, setDirectThreadUser] = useState<any | null>(null);
  const [directThreads, setDirectThreads] = useState<Record<string, any[]>>({});
  const [threadAppearance, setThreadAppearance] = useState<any>(null);
  const [directDraft, setDirectDraft] = useState("");
  const [directLoading, setDirectLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    dmToast: true,
    chatToast: true,
    emailNotifications: false,
  });
  const [memberships, setMemberships] = useState<any[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [chatPolicy, setChatPolicy] = useState(defaultChatPolicy);
  const [chatPolicyMeta, setChatPolicyMeta] = useState({
    globalPolicy: defaultChatPolicy,
    orgOverride: defaultChatOrgOverride,
  });
  const [policyLoading, setPolicyLoading] = useState(false);
  const [resolvedBaseUrl, setResolvedBaseUrl] = useState("");
  const [toastQueue, setToastQueue] = useState<{ id: string; title: string; description: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "grid" | "users" | "assets" | "memory" | "version" | "collab">("chat");
  
  const [selectedNexusTag, setSelectedNexusTag] = useState<string | null>(null);
  
  // Collab State
  const [collabViewMode, setCollabViewMode] = useState<"chats" | "links">("chats");
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [mockChannels] = useState([
    { id: "c1", name: "general", type: "channel", readOnly: false },
    { id: "c2", name: "announcements", type: "channel", readOnly: true },
  ]);
  const [mockGroups] = useState([
    { id: "g1", name: "Dev Ops Team", type: "group", unread: 2 },
    { id: "g2", name: "Project Alpha", type: "group", unread: 0 },
  ]);
  const [isCreateDMOpen, setIsCreateDMOpen] = useState(false);
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);

  const deleteThread = async (thread: any) => {
    if (!confirm("TERMINATE_CHANNEL? Data will be purged.")) return;
    try {
        const res = await fetch(`/api/collaboration/threads/${thread.id}`, { method: "DELETE" });
        if (res.ok) {
            setDirectThreads(prev => {
                const next = { ...prev };
                delete next[thread.id];
                return next;
            });
            if (directThreadUser?.id === thread.id) setDirectThreadUser(null);
            pushToast("CHANNEL_PURGED", "The communication line has been terminated.");
        }
    } catch (e) { console.error(e); }
  };

  const leaveThread = async (thread: any) => {
    if (!confirm("EXIT_SQUADRON? Access will be revoked.")) return;
    try {
        const res = await fetch(`/api/collaboration/threads/${thread.id}/leave`, { method: "POST" });
        if (res.ok) {
            pushToast("SQUADRON_EXITED", "You have successfully departed the squadron.");
            window.location.reload(); 
        }
    } catch (e) { console.error(e); }
  };

  const fetchDirectoryUsers = async (query: string = "") => {
    try {
      setDirectoryLoading(true);
      const res = await fetch(`/api/collaboration/users?q=${query}`);
      const data = await res.json();
      if (data.users) setDirectoryUsers(data.users);
    } catch (e) {
      console.error("Failed to fetch users");
    } finally {
      setDirectoryLoading(false);
    }
  };

  const notificationSettingsRef = useRef(notificationSettings);
  const activeTabRef = useRef(activeTab);
  const directThreadUserRef = useRef<any | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

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
  const [shareUrl, setShareUrl] = useState("");
  const [memories, setMemories] = useState<any[]>([]);
  const [memorySearch, setMemorySearch] = useState("");
  const [memorySort, setMemorySort] = useState("recent");
  const [memoryFilter, setMemoryFilter] = useState<string | null>(null);
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

  const pushToast = (title: string, description: string) => {
    // Send native notification if on desktop
    if (typeof window !== "undefined" && (window as any).nexusDesktop) {
      (window as any).nexusDesktop.send("toMain", { type: "notify", title, body: description });
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToastQueue((prev) => [...prev, { id, title, description }]);
    setTimeout(() => {
      setToastQueue((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
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
    if (!chatPolicy.allowFileUploads) {
      showError("UPLOADS_DISABLED", "File attachments are restricted by active collaboration policy.");
      return;
    }
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
    if (typeof window !== "undefined") {
      setResolvedBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    notificationSettingsRef.current = notificationSettings;
  }, [notificationSettings]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    directThreadUserRef.current = directThreadUser;
  }, [directThreadUser]);

  useEffect(() => {
    currentUserIdRef.current = (session?.user as any)?.id || null;
  }, [session?.user]);

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
        setMemberships(data.user.memberships || []);
        setActiveOrgId(data.user.activeOrgId ?? null);
        if (data.user.notificationSettings) {
          setNotificationSettings((prev) => ({
            ...prev,
            ...data.user.notificationSettings,
          }));
        }
      } catch (err) {
        console.warn("PROFILE_SYNC_FAILED");
      }
    };

    syncProfile();

    return () => {
      isActive = false;
    };
  }, [sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let active = true;
    const loadPolicy = async () => {
      setPolicyLoading(true);
      try {
        const res = await fetch("/api/chat/policy", { cache: "no-store" });
        const data = await res.json();
        if (!active || !res.ok) return;
        if (data.policy) setChatPolicy(data.policy);
        if (data.globalPolicy && data.orgOverride) {
          setChatPolicyMeta({ globalPolicy: data.globalPolicy, orgOverride: data.orgOverride });
        }
      } catch (err) {
        console.warn("CHAT_POLICY_LOAD_FAILED");
      } finally {
        if (active) setPolicyLoading(false);
      }
    };
    loadPolicy();
    return () => {
      active = false;
    };
  }, [sessionStatus, activeOrgId]);

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
      synth.playIncomingMessage();
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("message-updated", (data) => {
      setMessages(prev => prev.map(m => m.id === data.id ? { ...m, content: data.content } : m));
      setStatus("IDLE");
    });

    socket.on("direct-message", (message) => {
      const currentUserId = currentUserIdRef.current;
      const otherId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      
      if (message.senderId !== currentUserId) {
        synth.playIncomingMessage();
      }

      setDirectThreads((prev) => {
        const existing = prev[otherId] || [];
        if (existing.find((m: any) => m.id === message.id)) return prev;
        return { ...prev, [otherId]: [...existing, message] };
      });

      const settings = notificationSettingsRef.current;
      const activeThreadId = directThreadUserRef.current?.id;
      if (settings?.dmToast !== false && message.senderId !== currentUserId && activeThreadId !== message.senderId) {
        const senderName = message.sender?.name || "New message";
        pushToast("DIRECT_SIGNAL", `${senderName}: ${message.content.slice(0, 120)}`);
        synth.playNotification();
      }
    });

    socket.on("message-reaction", ({ messageId, emoji, userId, action }) => {
      synth.playReaction();
      const updateMessages = (prev: any[]) => prev.map(m => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions || [];
        if (action === "ADDED") {
          return { ...m, reactions: [...reactions, { emoji, userId }] };
        } else {
          return { ...m, reactions: reactions.filter((r: any) => !(r.emoji === emoji && r.userId === userId)) };
        }
      });

      setMessages(prev => updateMessages(prev));
      setDirectThreads(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const messages = next[key];
          if (messages) {
            next[key] = updateMessages(messages);
          }
        });
        return next;
      });
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

  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (userId && socketRef.current) {
      socketRef.current.emit("join-user", userId);
    }
  }, [session?.user]);

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
      const isBot = selectedModel.startsWith("bot:");
      const botId = isBot ? selectedModel.split("bot:")[1] : undefined;
      
      const payload: any = { 
        title: isBot ? `Link: ${models.find(m => m.name === selectedModel)?.displayName}` : "New Nexus Stream",
        config: { ...config } 
      };
      
      if (botId) payload.botId = botId;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          const [modelsRes, botsRes] = await Promise.all([
              fetch("/api/models"),
              fetch("/api/user/bots")
          ]);
          
          const modelsData = await modelsRes.json();
          const botsData = await botsRes.json();
          
          let allModels: any[] = [];
          
          if (modelsData.models) {
            allModels = [...modelsData.models];
          }
          
          if (botsData.bots) {
              const mappedBots = botsData.bots.map((b: any) => ({
                  name: `bot:${b.id}`, // Prefix to distinguish
                  displayName: `🤖 ${b.name}`,
                  description: b.description,
                  isBot: true,
                  botId: b.id
              }));
              allModels = [...mappedBots, ...allModels];
          }
          
          setModelsList(allModels);
        } catch (err) {
          console.error("Failed to fetch models or bots");
        }
      };
      const fetchSettings = async () => {      try {
        const res = await fetch("/api/chat/settings");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (data && data.allowedSquadSettings && Array.isArray(data.allowedSquadSettings)) {
          setAllowedSquadSettings(data.allowedSquadSettings);
        } else {
          console.warn("Received unexpected data format for allowedSquadSettings");
        }
      } catch (e) { console.error("Failed to load chat settings", e); }
    };
    
    const fetchConnections = async () => {
        try {
            const res = await fetch("/api/collaboration/connections");
            const data = await res.json();
            if (data.connections) {
                setDirectThreads(prev => {
                    const next = { ...prev };
                    data.connections.forEach((u: any) => {
                        if (!next[u.id]) next[u.id] = [];
                    });
                    return next;
                });
            }
        } catch (e) { console.error("Failed to load connections"); }
    };

    fetchSettings();
    if (sessionStatus === "authenticated") {
      fetchModels();
      fetchHistory();
      fetchConnections();
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

  const handleReact = async (messageId: string, emoji: string, isDM: boolean = false) => {
    const url = isDM 
      ? "/api/collaboration/messages/react" 
      : "/api/chat/messages/react";
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      const data = await res.json();
      
      if (res.ok) {
        // Emit via socket for real-time pop
        if (socketRef.current) {
          socketRef.current.emit("message-reaction", {
            chatId: isDM ? null : chatId,
            recipientId: isDM && directThreadUser ? directThreadUser.id : null,
            messageId,
            emoji,
            userId: (session?.user as any).id,
            action: data.action // ADDED or REMOVED
          });
        }

        // Local update
        const updateMessages = (prev: any[]) => prev.map(m => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions || [];
          if (data.action === "ADDED") {
            return { ...m, reactions: [...reactions, { emoji, userId: (session?.user as any).id }] };
          } else {
            return { ...m, reactions: reactions.filter((r: any) => !(r.emoji === emoji && r.userId === (session?.user as any).id)) };
          }
        });

        if (isDM && directThreadUser) {
          setDirectThreads(prev => ({
            ...prev,
            [directThreadUser.id]: updateMessages(prev[directThreadUser.id] || [])
          }));
        } else {
          setMessages(prev => updateMessages(prev));
        }
      }
    } catch (e) { console.error(e); }
  };

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
    if ((!input.trim() && filePreviews.length === 0) || status === "PROCESSING") return;

    // ... (existing logic) ...

    const currentModelIsBot = selectedModel.startsWith("bot:");
    const actualModelName = currentModelIsBot ? "models/gemini-2.0-flash" : selectedModel; // Fallback for bot
    const botId = currentModelIsBot ? selectedModel.split("bot:")[1] : undefined;

    // ... 
    
    // Instead of replacing the whole function which is huge, I will add a logic to update the config before sending or ensure the API handles it.
    // The '/api/chat/[id]/message' endpoint likely reads the Chat's config from DB or takes overrides.
    // If I'm creating a NEW chat, I need to pass botId.
    
    // Let's modify 'createNewChat' first, as that sets the session up.

    if (!input.trim() && filePreviews.length === 0) return;
    if (!chatPolicy.allowFileUploads && filePreviews.length > 0) {
      showError("UPLOADS_DISABLED", "File attachments are restricted by active collaboration policy.");
      return;
    }
    
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
      const tempUserId = Date.now().toString();
      const userMessage = {
        role: "user", 
        content: promptValue, 
        id: tempUserId,
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
      if (data.userMessage) {
        setMessages(prev => prev.map(m => m.id === tempUserId ? data.userMessage : m));
      }
      if (data.placeholderMessage) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.placeholderMessage.id)) return prev;
          return [...prev, data.placeholderMessage];
        });
      }

      if (socketRef.current && activeChatId) {
        if (data.userMessage) {
          socketRef.current.emit("new-message", { chatId: activeChatId, message: data.userMessage });
        }
        if (data.placeholderMessage) {
          socketRef.current.emit("new-message", { chatId: activeChatId, message: data.placeholderMessage });
        }
      }
      
      if (!chatId && activeChatId) {
        router.push(`/chat/${activeChatId}`);
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
                nexusTags={["Productivity", "Creative", "Coding", "Utility", "Roleplay", "Fun"]}
                selectedNexusTag={selectedNexusTag}
                onSelectNexusTag={setSelectedNexusTag}
                onNewChat={createNewChat}        history={history}
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
        channels={mockChannels}
        groups={mockGroups}
        directThreads={Object.values(directThreads).flat().map(m => m.senderId === (session?.user as any)?.id ? m.receiver : m.sender).filter((v,i,a)=>a.findIndex(t=>(t?.id === v?.id))===i).filter(Boolean)} // Simplified contact list derivation
        onSelectThread={(thread) => {
            if (thread.type === "channel" || thread.type === "group") {
                setActiveChannel(thread);
                setDirectThreadUser(null);
            } else {
                setDirectThreadUser(thread);
                setActiveChannel(null);
                // Ensure persistent entry in list
                setDirectThreads(prev => {
                    if (prev[thread.id]) return prev;
                    return { ...prev, [thread.id]: [] };
                });
            }
            setCollabViewMode("chats");
        }}
        onShowLinks={() => setCollabViewMode("links")}
        onCreateSquad={() => {
            setIsCreateSquadOpen(true);
            fetchDirectoryUsers();
        }}
        onCreateDM={() => {
            setIsCreateDMOpen(true);
            fetchDirectoryUsers();
        }}
        onDeleteThread={deleteThread}
        onLeaveThread={leaveThread}
        memories={memories}
        memoryFilter={memoryFilter}
        onMemoryFilterChange={setMemoryFilter}
        versionBranches={versionBranches}
        versionCheckpoints={versionCheckpoints}
        versionMergeRequests={versionMergeRequests}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
      />

      <main className="flex-1 min-h-0 flex flex-col relative z-10 pb-20 md:pb-0">
        {activeTab === "grid" ? (
          <NexusHubView
            filterTag={selectedNexusTag}
            onStartChat={(botId) => {
              // Stub: Switch to chat tab and load bot context
              console.log("Starting chat with bot:", botId);
              setActiveTab("chat");
              pushToast("BOT_INITIALIZED", "Agent context loaded successfully.");
            }}
          />
        ) : activeTab === "version" ? (
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
        ) : activeTab === "collab" ? (
          <CollaborationView
            chatId={chatId}
            baseUrl={resolvedBaseUrl}
            policy={chatPolicy}
            orgOverride={chatPolicyMeta.orgOverride}
            activeTab={collabViewMode}
            onTabChange={setCollabViewMode as any}
            links={collabLinks}
            linksLoading={collabLinksLoading}
            onToggleLink={(linkId, active) => {
              const toggle = async () => {
                try {
                  await fetch(`/api/chat/${chatId}/links/${linkId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ active }),
                  });
                  setCollabLinks((prev) =>
                    prev.map((l) => (l.id === linkId ? { ...l, active } : l))
                  );
                } catch (e) { console.error(e); }
              };
              toggle();
            }}
            onDeleteLink={(linkId) => {
              const del = async () => {
                try {
                  await fetch(`/api/chat/${chatId}/links/${linkId}`, {
                    method: "DELETE",
                  });
                  setCollabLinks((prev) => prev.filter((l) => l.id !== linkId));
                } catch (e) { console.error(e); }
              };
              del();
            }}
            owner={collabOwner}
            participants={collabParticipants}
            isOwner={collabOwner?.id === (session?.user as any)?.id}
            directoryUsers={directoryUsers}
            directThreadUser={directThreadUser || activeChannel}
            directMessages={directThreadUser ? (directThreads[directThreadUser.id] || []) : []}
            appearance={threadAppearance}
            onSaveAppearance={async (appearance) => {
              if (!directThreadUser && !activeChannel) return;
              const isDM = !!directThreadUser;
              const targetId = isDM ? directThreadUser.id : activeChannel.id;
              const url = isDM 
                ? "/api/collaboration/messages/appearance" 
                : `/api/chat/${targetId}/appearance`;
              
              try {
                const res = await fetch(url, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    [isDM ? "otherUserId" : "id"]: targetId, 
                    appearance 
                  }),
                });
                if (res.ok) setThreadAppearance(appearance);
              } catch (e) { console.error(e); }
            }}
            directDraft={directDraft}
            onDirectDraftChange={setDirectDraft}
            onOpenThread={(user) => {
              setDirectThreadUser(user);
              // Fetch thread messages
              const loadThread = async () => {
                try {
                  const res = await fetch(`/api/collaboration/messages?userId=${user.id}`);
                  const data = await res.json();
                  setDirectThreads(prev => ({ ...prev, [user.id]: data.messages || [] }));
                  setThreadAppearance(data.appearance || null);
                } catch (e) { console.error(e); }
              };
              loadThread();
            }}
            onSendDirectMessage={(files?: string[]) => {
              if (!directThreadUser?.id || (!directDraft.trim() && (!files || files.length === 0))) return;
              if (directThreadUser.id === (session?.user as any)?.id) {
                pushToast("INVALID_TARGET", "Cannot establish a neural link with yourself.");
                return;
              }
              const send = async () => {
                const tempId = Date.now().toString();
                const optimisticMsg = {
                  id: tempId,
                  content: directDraft,
                  senderId: (session?.user as any)?.id,
                  receiverId: directThreadUser.id,
                  createdAt: new Date().toISOString(),
                  sender: { id: (session?.user as any)?.id, name: profileName, image: profileImage },
                  receiver: directThreadUser,
                  assets: (files || []).map((url, idx) => ({ id: `temp-${idx}`, url })),
                  reactions: []
                };
                setDirectThreads(prev => ({
                  ...prev,
                  [directThreadUser.id]: [...(prev[directThreadUser.id] || []), optimisticMsg]
                }));
                setDirectDraft("");
                
                try {
                  const res = await fetch("/api/collaboration/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        userId: directThreadUser.id, 
                        content: optimisticMsg.content,
                        assetUrls: files // Passing base64 for now
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "UPLINK_ERROR");

                  setDirectThreads(prev => ({
                    ...prev,
                    [directThreadUser.id]: (prev[directThreadUser.id] || []).map(m => m.id === tempId ? data.message : m)
                  }));
                  
                  if (socketRef.current) {
                    socketRef.current.emit("direct-message", { 
                      recipientId: directThreadUser.id, 
                      message: data.message 
                    });
                  }
                } catch (e: any) { 
                    console.error(e);
                    pushToast("TRANSMISSION_FAILED", e.message);
                }
              };
              send();
            }}
            onReact={(messageId: string, emoji: string) => handleReact(messageId, emoji, true)}
            notificationSettings={notificationSettings}
            onUpdateNotifications={(next) => {
               // Stub for settings update
               setNotificationSettings(prev => ({ ...prev, ...next }));
               const update = async () => {
                 try {
                   await fetch("/api/user", {
                     method: "PATCH",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ notificationSettings: next }),
                   });
                 } catch (e) { console.error(e); }
               };
               update();
            }}
            memberships={memberships}
            activeOrgId={activeOrgId}
            onOrgChange={async (orgId) => {
               setActiveOrgId(orgId);
               try {
                 await fetch("/api/user", {
                   method: "PATCH",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({ activeOrgId: orgId }),
                 });
                 window.location.reload(); // Hard reload to refresh context
               } catch (e) { console.error(e); }
            }}
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
                <div
                  onClick={() => chatPolicy.allowModelSelection && setIsModelModelMenuOpen(!isModelMenuOpen)}
                  className={cn(
                    "flex items-center gap-3 group",
                    chatPolicy.allowModelSelection ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  )}
                >
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
          <motion.div
             variants={{
               hidden: { opacity: 0 },
               visible: {
                 opacity: 1,
                 transition: {
                   staggerChildren: 0.1
                 }
               }
             }}
             initial="hidden"
             animate="visible"
          >
            <AnimatePresence initial={false} mode="popLayout">
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
                <motion.div key={m.id || i} variants={{ hidden: { opacity: 0, y: 20, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 } }} exit={{ opacity: 0, scale: 0.95 }} layout className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn("flex gap-4 md:gap-6 max-w-5xl mx-auto group w-full", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
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
                        "relative p-4 md:p-6 rounded-[24px] border transition-all duration-500 max-w-full group/msg",
                        m.role === "user" 
                          ? "bg-white/[0.03] border-white/10 rounded-tr-none shadow-xl hover:border-primary/20" 
                          : "glass-panel border-white/5 rounded-tl-none shadow-2xl hover:border-secondary/20"
                      )}>
                        {/* ... (assets rendering) ... */}

                        <div className="text-sm md:text-[16px] leading-relaxed text-white/90 font-medium tracking-tight markdown-content pb-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                        <div className={cn("absolute top-0 transform -translate-y-1/2 px-3 py-1 rounded-full text-[8px] font-black tracking-[0.2em] border", m.role === "user" ? "right-6 bg-primary text-black border-primary/50" : "left-6 bg-secondary text-white border-secondary/50")}>{m.role.toUpperCase()}</div>

                        {/* Reaction Trigger (Hover) */}
                        <div className={cn(
                          "absolute top-2 opacity-0 group-hover/msg:opacity-100 transition-all duration-300 z-20",
                          m.role === "user" ? "right-full mr-3" : "left-full ml-3"
                        )}>
                          <button 
                            onClick={() => setShowEmojiPicker(showEmojiPicker === m.id ? null : m.id)}
                            className="p-2 rounded-xl bg-panel border border-white/10 hover:border-primary/50 text-white/40 hover:text-primary backdrop-blur-xl shadow-lg transition-all active:scale-90"
                          >
                            <SmilePlus className="w-4 h-4" />
                          </button>
                          
                          <AnimatePresence>
                            {showEmojiPicker === m.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8, x: m.role === 'user' ? 10 : -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: m.role === 'user' ? 10 : -10 }}
                                className={cn(
                                    "absolute top-0 p-1.5 rounded-xl bg-black/90 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-1 z-[60]",
                                    m.role === "user" ? "right-full mr-2 origin-right" : "left-full ml-2 origin-left",
                                    i === 0 ? "top-0" : "-top-2" // Prevent cutoff for first message
                                )}
                              >
                                {["👍", "🔥", "😂", "😮", "😢", "😡"].map(emoji => (
                                  <button 
                                    key={emoji} 
                                    onClick={() => {
                                        handleReact(m.id, emoji, false);
                                        setShowEmojiPicker(null);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-all hover:scale-110 text-lg"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Rendered Reactions */}
                      {m.reactions && m.reactions.length > 0 && (
                        <div className={cn(
                            "flex flex-wrap gap-1.5 mt-3 px-2",
                            m.role === "user" ? "justify-end" : "justify-start"
                        )}>
                          {Object.entries((m.reactions || []).reduce((acc: any, r: any) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {})).map(([emoji, count]: any) => (
                            <button 
                              key={emoji}
                              onClick={() => handleReact(m.id, emoji, false)}
                              className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 text-xs flex items-center gap-2 backdrop-blur-md transition-all active:scale-90"
                            >
                              <span>{emoji}</span>
                              <span className="font-black text-[10px] opacity-40">{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </motion.div>
          {status === "PROCESSING" && (
            <div className="flex gap-6 max-w-5xl mx-auto items-center text-primary/40 text-xs font-black tracking-widest animate-pulse">
               <Activity className="w-4 h-4" /> INCOMING TRANSMISSION...
            </div>
          )}
          {Object.entries(typingUsers).length > 0 && (
            <div className="flex gap-4 max-w-5xl mx-auto items-center text-secondary/60 text-xs font-black tracking-widest pl-2">
               <TypingWaveform />
               <span className="animate-pulse">{Object.values(typingUsers).join(", ")} IS ENCODING...</span>
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
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!chatPolicy.allowFileUploads}
                  className={cn(
                    "p-4 transition-colors",
                    chatPolicy.allowFileUploads ? "text-white/20 hover:text-primary" : "text-white/10 cursor-not-allowed"
                  )}
                >
                  <FilePlus className="w-6 h-6" />
                </button>
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
        allowCustomApiKey={chatPolicy.allowCustomApiKey}
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

      <CreateDMModal
        isOpen={isCreateDMOpen}
        onClose={() => setIsCreateDMOpen(false)}
        users={directoryUsers}
        onSearch={fetchDirectoryUsers}
        onConfirm={(userId) => {
          const user = directoryUsers.find(u => u.id === userId);
          if (user) {
            setDirectThreadUser(user);
            setActiveTab("collab");
            setCollabViewMode("chats");
          }
        }}
      />

      <CreateSquadModal
        isOpen={isCreateSquadOpen}
        onClose={() => setIsCreateSquadOpen(false)}
        users={directoryUsers}
        onSearch={fetchDirectoryUsers}
        allowedSettings={allowedSquadSettings}
        onConfirm={(data) => {
           console.log("Created Squad:", data);
           // In real app: API call to create group chat with data.name and data.settings
        }}
      />

    </div>
  );
}
