"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Users,
  ExternalLink,
  Search,
  Globe,
  Network,
  ChevronRight,
  Link as LinkIcon,
  ShieldCheck,
  Clock,
  Check,
  UserX,
  Settings2,
  Lock,
  ShieldAlert,
  User,
  Activity,
  Zap,
  Info,
  Image,
  Mail,
  Phone,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrgChart } from "./org-chart";
import { ValidatedInput } from "../ui/validated-input";
import { CustomSelect } from "../ui/custom-select";
import { ImpressiveModal } from "@/components/impressive-modal";

import { defaultOrgChatPolicy } from "@/lib/org-policy";

interface OrganizationManagementProps {
  initialOrgs: any[];
  availablePermissions: any[];
  baseUrl: string;
}

export function OrganizationManagement({ initialOrgs, availablePermissions, baseUrl }: OrganizationManagementProps) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  const [resolvedBaseUrl, setResolvedBaseUrl] = useState(baseUrl);
  
  const [vizOrgId, setVizOrgId] = useState<string | null>(null);
  const [vizData, setVizData] = useState<any>(null);
  
  const [manageOrgId, setManageOrgId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"links" | "requests" | "members" | "overrides">("links");
  const [links, setLinks] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [overrideSelectValue, setOverrideSelectValue] = useState("");
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type?: "danger" | "info" | "success";
    confirmText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const [detailsOrgId, setDetailsOrgId] = useState<string | null>(null);
  const [detailsStep, setDetailsStep] = useState(0);
  const [isDetailsSaving, setIsDetailsSaving] = useState(false);
  
  const [globalPolicy, setGlobalPolicy] = useState<any>(null);
  const [systemOrgOverride, setSystemOrgOverride] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setResolvedBaseUrl(window.location.origin);
    }
    
    fetch("/api/admin/chat/policy")
      .then(res => res.json())
      .then(data => {
        if (data.policy) setGlobalPolicy(data.policy);
        if (data.orgOverride) setSystemOrgOverride(data.orgOverride);
      })
      .catch(err => console.error("Failed to load global policy", err));
  }, []);

  const emptyDetailsForm = {
    description: "",
    tagline: "",
    mission: "",
    industry: "",
    website: "",
    foundedYear: "",
    employeeRange: "",
    headquarters: "",
    operatingRegions: "",
    timeZone: "",
    operatingModel: "",
    productFocus: "",
    customerSegments: "",
    criticalWorkflows: "",
    supportWindow: "",
    serviceTier: "",
    logo: "",
    banner: "",
    brandPalette: "",
    brandVoice: "",
    securityTier: "",
    compliance: "",
    dataClassification: "",
    dataResidency: "",
    riskProfile: "",
    uptimeTarget: "",
    deploymentModel: "",
    identityProvider: "",
    integrationStack: "",
    dataWarehouse: "",
    erpCrm: "",
    aiUseCases: "",
    incidentEscalation: "",
    pointOfContactName: "",
    pointOfContactEmail: "",
    pointOfContactPhone: "",
    billingContact: "",
    legalContact: "",
    notes: ""
  };

  const [detailsForm, setDetailsForm] = useState<any>(emptyDetailsForm);

  const [linkConfig, setLinkConfig] = useState({
    label: "",
    requiresApproval: true,
    maxUses: "",
    expiresAt: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    pointOfContactName: "",
    pointOfContactEmail: "",
    pointOfContactPhone: "",
    primaryInviteRequiresApproval: false,
    primaryInviteLabel: "Primary Invite"
  });

  const validateName = (val: string) => {
    if (!val) return "Entity name required";
    if (val.length < 3) return "Name too brief (min 3)";
    return null;
  };

  const validateSlug = (val: string) => {
    if (!val) return "Identifier required";
    if (!/^[a-z0-9-]+$/.test(val)) return "Invalid format (lowercase, numbers, hyphens only)";
    return null;
  };

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setResolvedBaseUrl(window.location.origin);
    }
  }, []);

  const onboardingSteps = [
    { label: "IDENTITY_CORE", subtitle: "Base identity and operational scope", icon: <Building2 className="w-4 h-4" /> },
    { label: "BRAND_SURFACE", subtitle: "Logo, banner, and tone controls", icon: <Image className="w-4 h-4" /> },
    { label: "OPS_MATRIX", subtitle: "Operating model and workflows", icon: <Activity className="w-4 h-4" /> },
    { label: "SECURITY_GRID", subtitle: "Compliance and risk posture", icon: <Lock className="w-4 h-4" /> },
    { label: "INTEGRATION_MAP", subtitle: "Systems and data pipelines", icon: <Zap className="w-4 h-4" /> },
    { label: "CONTACT_RELAY", subtitle: "POC, escalation, and notes", icon: <User className="w-4 h-4" /> }
  ];

  const buildDetailsForm = (org: any) => {
    const profile = org?.onboardingProfile && typeof org.onboardingProfile === "object" ? org.onboardingProfile : {};
    return {
      ...emptyDetailsForm,
      description: org?.description || "",
      logo: org?.logo || "",
      banner: org?.banner || "",
      pointOfContactName: org?.pointOfContactName || "",
      pointOfContactEmail: org?.pointOfContactEmail || "",
      pointOfContactPhone: org?.pointOfContactPhone || "",
      tagline: profile.tagline || "",
      mission: profile.mission || "",
      industry: profile.industry || "",
      website: profile.website || "",
      foundedYear: profile.foundedYear || "",
      employeeRange: profile.employeeRange || "",
      headquarters: profile.headquarters || "",
      operatingRegions: profile.operatingRegions || "",
      timeZone: profile.timeZone || "",
      operatingModel: profile.operatingModel || "",
      productFocus: profile.productFocus || "",
      customerSegments: profile.customerSegments || "",
      criticalWorkflows: profile.criticalWorkflows || "",
      supportWindow: profile.supportWindow || "",
      serviceTier: profile.serviceTier || "",
      brandPalette: profile.brandPalette || "",
      brandVoice: profile.brandVoice || "",
      securityTier: profile.securityTier || "",
      compliance: profile.compliance || "",
      dataClassification: profile.dataClassification || "",
      dataResidency: profile.dataResidency || "",
      riskProfile: profile.riskProfile || "",
      uptimeTarget: profile.uptimeTarget || "",
      deploymentModel: profile.deploymentModel || "",
      identityProvider: profile.identityProvider || "",
      integrationStack: profile.integrationStack || "",
      dataWarehouse: profile.dataWarehouse || "",
      erpCrm: profile.erpCrm || "",
      aiUseCases: profile.aiUseCases || "",
      incidentEscalation: profile.incidentEscalation || "",
      billingContact: profile.billingContact || "",
      legalContact: profile.legalContact || "",
      notes: profile.notes || ""
    };
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new globalThis.Image(); // Use globalThis.Image to avoid conflict with Lucide Image icon
            img.src = event.target?.result as string;
            img.onload = () => {
                const elem = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    } else {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(ctx?.canvas.toDataURL(file.type, 0.9) || "");
            };
            img.onerror = (error) => reject(error);
        };
    });
  };

  const handleFileSelect = async (field: string, e: React.ChangeEvent<HTMLInputElement>, maxWidth: number, maxHeight: number) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const resized = await resizeImage(file, maxWidth, maxHeight);
            updateDetailsField(field, resized);
        } catch (error) {
            console.error("Image resize failed", error);
        }
    }
  };

  const FileUpload = ({ label, value, onChange, previewHeight = "h-32", previewWidth = "w-full" }: any) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">{label}</label>
        <div className="flex flex-col gap-3">
            <div className={cn("rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden relative group", previewHeight, previewWidth)}>
                {value ? (
                    <img src={value} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-[9px] uppercase font-black tracking-[0.3em] text-white/20">PREVIEW</div>
                )}
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={onChange} />
                    <div className="flex flex-col items-center gap-2 text-white">
                        <Upload className="w-5 h-5" />
                        <span className="text-[8px] font-black tracking-widest uppercase">CHANGE_IMAGE</span>
                    </div>
                </label>
            </div>
            {!value && (
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all text-white/40 hover:text-white">
                    <input type="file" className="hidden" accept="image/*" onChange={onChange} />
                    <Upload className="w-4 h-4" />
                    <span className="text-[9px] font-black tracking-widest uppercase">UPLOAD_FILE</span>
                </label>
            )}
        </div>
    </div>
  );

  const openViz = async (org: any) => {
    setManageOrgId(null);
    setDetailsOrgId(null);
    setVizOrgId(org.id);
    try {
        const res = await fetch(`/api/admin/organizations/${org.id}/structure`);
        const data = await res.json();
        setVizData(data.structure);
    } catch (err) {
        console.error("Failed to fetch org structure");
    }
  };

  const openManage = async (orgId: string) => {
    setDetailsOrgId(null);
    setVizOrgId(null);
    setManageOrgId(orgId);
    setLinkConfig({ label: "", requiresApproval: true, maxUses: "", expiresAt: "" });
    setOverrideSelectValue("");
    setIsDataLoading(true);
    try {
        const [lRes, rRes, mRes, oRes] = await Promise.all([
            fetch(`/api/admin/organizations/${orgId}/links`),
            fetch(`/api/admin/organizations/${orgId}/requests`),
            fetch(`/api/admin/organizations/${orgId}/members`),
            fetch(`/api/admin/organizations/${orgId}/overrides`)
        ]);
        const lData = await lRes.json();
        const rData = await rRes.json();
        const mData = await mRes.json();
        const oData = await oRes.json();
        setLinks(lData.links || []);
        setRequests(rData.requests || []);
        setMembers(mData.members || []);
        setOverrides(oData.overrides || []);
    } catch (err) {
        console.error("Management data fetch failed");
    } finally {
        setIsDataLoading(false);
    }
  };

  const openDetails = (org: any) => {
    setManageOrgId(null);
    setVizOrgId(null);
    setDetailsOrgId(org.id);
    setDetailsStep(0);
    setDetailsForm(buildDetailsForm(org));
  };

  const closeDetails = () => {
    setDetailsOrgId(null);
    setDetailsStep(0);
    setDetailsForm(emptyDetailsForm);
  };

  const updateDetailsField = (field: string, value: string) => {
    setDetailsForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveDetails = async () => {
    if (!detailsOrgId) return;
    setIsDetailsSaving(true);
    const {
      logo,
      banner,
      pointOfContactName,
      pointOfContactEmail,
      pointOfContactPhone,
      description,
      ...profile
    } = detailsForm;

    try {
      const res = await fetch(`/api/admin/organizations/${detailsOrgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo,
          banner,
          description,
          pointOfContactName,
          pointOfContactEmail,
          pointOfContactPhone,
          onboardingProfile: profile
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrgs(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
      }
    } catch (err) {
      console.error("Failed to update onboarding profile");
    } finally {
      setIsDetailsSaving(false);
    }
  };

  const handleKickMember = async (memberId: string) => {
    openConfirm({
      title: "TERMINATE_ACCESS",
      description: "This operative will be unlinked from the sector and removed from active access.",
      type: "danger",
      confirmText: "EXECUTE_PURGE",
      onConfirm: async () => {
        try {
            const res = await fetch(`/api/admin/organizations/${manageOrgId}/members/${memberId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setMembers(prev => prev.filter(m => m.userId !== memberId));
            }
        } catch (err) {
            console.error("Failed to kick member");
        }
      }
    });
  };

  const handleToggleOrgOverride = async (permissionName: string, currentValue: boolean) => {
    try {
        const res = await fetch(`/api/admin/organizations/${manageOrgId}/overrides`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permissionName, value: !currentValue })
        });
        if (res.ok) {
            const updated = await res.json();
            setOverrides(prev => {
                const idx = prev.findIndex(o => o.permissionId === updated.permissionId);
                if (idx !== -1) {
                    const next = [...prev];
                    next[idx] = { ...next[idx], value: updated.value };
                    return next;
                }
                return [...prev, updated];
            });
            return true;
        }
        return false;
    } catch (err) {
        console.error("Override toggle failed");
        return false;
    }
  };

  const handleToggleLinkStatus = async (linkId: string, currentActive: boolean) => {
    try {
        const res = await fetch(`/api/admin/organizations/${manageOrgId}/links/${linkId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: !currentActive })
        });
        if (res.ok) {
            const updated = await res.json();
            setLinks(prev => prev.map(l => l.id === linkId ? { ...l, active: updated.active } : l));
        }
    } catch (err) {
        console.error("Link status toggle failed");
    }
  };

  const handleToggleLinkApproval = async (linkId: string, currentValue: boolean) => {
    try {
        const res = await fetch(`/api/admin/organizations/${manageOrgId}/links/${linkId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requiresApproval: !currentValue })
        });
        if (res.ok) {
            const updated = await res.json();
            setLinks(prev => prev.map(l => l.id === linkId ? { ...l, requiresApproval: updated.requiresApproval } : l));
        }
    } catch (err) {
        console.error("Link approval toggle failed");
    }
  };

  const handleReissueLink = async (linkId: string) => {
    openConfirm({
      title: "REISSUE_LINK",
      description: "Rotating this access code will invalidate the existing link immediately.",
      type: "info",
      confirmText: "ROTATE_CODE",
      onConfirm: async () => {
        try {
            const res = await fetch(`/api/admin/organizations/${manageOrgId}/links/${linkId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reissue: true })
            });
            if (res.ok) {
                const updated = await res.json();
                setLinks(prev => prev.map(l => l.id === linkId ? { ...l, code: updated.code, useCount: updated.useCount, active: updated.active } : l));
            }
        } catch (err) {
            console.error("Link reissue failed");
        }
      }
    });
  };

  const handleDeleteLink = async (linkId: string) => {
    openConfirm({
      title: "PURGE_LINK",
      description: "This access point will be permanently disabled and removed from circulation.",
      type: "danger",
      confirmText: "DISABLE_LINK",
      onConfirm: async () => {
        try {
            const res = await fetch(`/api/admin/organizations/${manageOrgId}/links/${linkId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setLinks(prev => prev.filter(l => l.id !== linkId));
            }
        } catch (err) {
            console.error("Link deletion failed");
        }
      }
    });
  };

  const handleActionRequest = async (requestId: string, action: "APPROVE" | "REJECT") => {
    try {
        const res = await fetch(`/api/admin/organizations/${manageOrgId}/requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId, action })
        });
        if (res.ok) {
            setRequests(prev => prev.filter(r => r.id !== requestId));
        }
    } catch (err) {
        console.error("Request action failed");
    }
  };

  const handleCreateLink = async () => {
    try {
        const res = await fetch(`/api/admin/organizations/${manageOrgId}/links`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              label: linkConfig.label || "Secondary Invite",
              requiresApproval: linkConfig.requiresApproval,
              maxUses: linkConfig.maxUses ? Number(linkConfig.maxUses) : undefined,
              expiresAt: linkConfig.expiresAt || undefined
            })
        });
        if (res.ok) {
            const newLink = await res.json();
            setLinks(prev => [newLink, ...prev]);
            setLinkConfig({ label: "", requiresApproval: true, maxUses: "", expiresAt: "" });
        }
    } catch (err) {
        console.error("Link creation failed");
    }
  };

  const handleCreatePrimaryLink = async () => {
    try {
        const res = await fetch(`/api/admin/organizations/${manageOrgId}/links`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              label: "Primary Invite",
              requiresApproval: false,
              isPrimary: true
            })
        });
        if (res.ok) {
            const newLink = await res.json();
            setLinks(prev => [newLink, ...prev]);
        }
    } catch (err) {
        console.error("Primary link creation failed");
    }
  };

  const openModal = (org?: any) => {
    if (org) {
      setEditingOrg(org);
      setFormData({ 
        name: org.name, 
        slug: org.slug, 
        description: org.description || "",
        pointOfContactName: org.pointOfContactName || "",
        pointOfContactEmail: org.pointOfContactEmail || "",
        pointOfContactPhone: org.pointOfContactPhone || "",
        primaryInviteRequiresApproval: false,
        primaryInviteLabel: "Primary Invite"
      });
    } else {
      setEditingOrg(null);
      setFormData({ 
        name: "", 
        slug: "", 
        description: "",
        pointOfContactName: "",
        pointOfContactEmail: "",
        pointOfContactPhone: "",
        primaryInviteRequiresApproval: false,
        primaryInviteLabel: "Primary Invite"
      });
    }
    setIsModalOpen(true);
  };

  const openConfirm = (config: {
    title: string;
    description: string;
    type?: "danger" | "info" | "success";
    confirmText?: string;
    onConfirm: () => void;
  }) => {
    setConfirmState({
      isOpen: true,
      title: config.title,
      description: config.description,
      type: config.type,
      confirmText: config.confirmText,
      onConfirm: config.onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  const confirmModal = (
    <ImpressiveModal
      isOpen={confirmState.isOpen}
      onClose={closeConfirm}
      onConfirm={confirmState.onConfirm}
      title={confirmState.title}
      description={confirmState.description}
      type={confirmState.type}
      confirmText={confirmState.confirmText}
    />
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateName(formData.name) || validateSlug(formData.slug)) return;

    const method = editingOrg ? "PATCH" : "POST";
    const url = editingOrg ? `/api/admin/organizations/${editingOrg.id}` : "/api/admin/organizations";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        if (editingOrg) {
          setOrgs(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
        } else {
          setOrgs(prev => [updated, ...prev]);
        }
        closeModal();
      }
    } catch (err) {
      console.error("Failed to save organization");
    }
  };

  const handleDelete = async (id: string) => {
    openConfirm({
      title: "DELETE_ORGANIZATION",
      description: "This will remove the sector, members, and all associated access data.",
      type: "danger",
      confirmText: "PURGE_SECTOR",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/organizations/${id}`, { method: "DELETE" });
          if (res.ok) {
            setOrgs(prev => prev.filter(o => o.id !== id));
          }
        } catch (err) {
          console.error("Failed to delete organization");
        }
      }
    });
  };

  if (vizOrgId && vizData) {
    return (
        <div className="space-y-10 font-mono">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-primary">SECTOR_VISUALIZATION</h1>
                    <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mt-2 font-mono">Topographical mapping of {orgs.find(o => o.id === vizOrgId)?.name}</p>
                </div>
                <button 
                    onClick={() => setVizOrgId(null)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-black tracking-[0.2em] hover:text-white transition-all"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    CLOSE_MAP
                </button>
            </div>
            <OrgChart data={vizData} />
            {confirmModal}
        </div>
    );
  }

  if (detailsOrgId) {
    const org = orgs.find(o => o.id === detailsOrgId);
    const stepMeta = onboardingSteps[detailsStep];
    const progressPercent = Math.round(((detailsStep + 1) / onboardingSteps.length) * 100);
    return (
        <div className="space-y-10 font-mono pb-16">
            <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
                        {detailsForm.logo ? (
                            <img src={detailsForm.logo} alt={`${org?.name} logo`} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="w-8 h-8 text-primary" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase">ORG_ONBOARDING_MATRIX</h1>
                        <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Capture intelligence for {org?.name || "UNKNOWN_SECTOR"}</p>
                    </div>
                </div>
                <button 
                    onClick={closeDetails}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-black tracking-[0.2em] hover:text-white transition-all"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    BACK_TO_SQUADRONS
                </button>
            </div>

            <div className="glass-panel rounded-[32px] border-white/5 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-black/60 to-black/80" />
                {detailsForm.banner && (
                    <div className="absolute inset-0 opacity-40">
                        <img src={detailsForm.banner} alt={`${org?.name} banner`} className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="relative z-10 p-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black tracking-[0.4em] uppercase text-white/30">SECTOR_PROFILE</div>
                            <div className="text-2xl font-black tracking-tighter text-white uppercase mt-2">{org?.name}</div>
                            <div className="text-[10px] text-primary font-mono mt-1">/{org?.slug}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] font-black uppercase text-white/40 tracking-[0.3em]">SYNC_PROGRESS</div>
                            <div className="text-2xl font-black text-primary mt-2">{progressPercent}%</div>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {onboardingSteps.map((step, idx) => (
                    <button
                        key={step.label}
                        onClick={() => setDetailsStep(idx)}
                        className={cn(
                            "p-3 rounded-2xl border text-left transition-all",
                            idx === detailsStep 
                                ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_20px_rgba(0,242,255,0.1)]" 
                                : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/20"
                        )}
                    >
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em]">
                            {step.icon}
                            {step.label}
                        </div>
                        <div className="text-[8px] text-white/30 uppercase mt-2 leading-relaxed">{step.subtitle}</div>
                    </button>
                ))}
            </div>

            <div className="glass-panel p-8 rounded-[32px] border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,242,255,0.08),_transparent_55%)] opacity-70" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3 text-primary">
                            {stepMeta?.icon}
                            <div>
                                <div className="text-xs font-black tracking-widest uppercase">{stepMeta?.label}</div>
                                <div className="text-[9px] text-white/30 uppercase mt-1">{stepMeta?.subtitle}</div>
                            </div>
                        </div>
                        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
                            STEP_{String(detailsStep + 1).padStart(2, "0")} / {String(onboardingSteps.length).padStart(2, "0")}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`step-${detailsStep}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {detailsStep === 0 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ValidatedInput 
                                            label="TAGLINE"
                                            value={detailsForm.tagline}
                                            onChange={(e) => updateDetailsField("tagline", e.target.value)}
                                            placeholder="E.g. NEURAL OPERATIONS CORE"
                                        />
                                        <ValidatedInput 
                                            label="WEBSITE"
                                            value={detailsForm.website}
                                            onChange={(e) => updateDetailsField("website", e.target.value)}
                                            placeholder="https://sector-domain.com"
                                        />
                                        <ValidatedInput 
                                            label="INDUSTRY"
                                            value={detailsForm.industry}
                                            onChange={(e) => updateDetailsField("industry", e.target.value)}
                                            placeholder="Defense, biotech, logistics..."
                                        />
                                        <ValidatedInput 
                                            label="FOUNDED_YEAR"
                                            value={detailsForm.foundedYear}
                                            onChange={(e) => updateDetailsField("foundedYear", e.target.value)}
                                            placeholder="1998"
                                        />
                                        <CustomSelect 
                                            label="EMPLOYEE_RANGE"
                                            value={detailsForm.employeeRange}
                                            options={[
                                              { label: "1-10", value: "1-10" },
                                              { label: "11-50", value: "11-50" },
                                              { label: "51-200", value: "51-200" },
                                              { label: "201-1000", value: "201-1000" },
                                              { label: "1000+", value: "1000+" }
                                            ]}
                                            onChange={(val) => updateDetailsField("employeeRange", val)}
                                        />
                                        <CustomSelect 
                                            label="TIME_ZONE"
                                            value={detailsForm.timeZone}
                                            options={[
                                              { label: "UTC-8 / PACIFIC", value: "UTC-8" },
                                              { label: "UTC-5 / EASTERN", value: "UTC-5" },
                                              { label: "UTC+0 / GMT", value: "UTC+0" },
                                              { label: "UTC+1 / CET", value: "UTC+1" },
                                              { label: "UTC+8 / SGT", value: "UTC+8" }
                                            ]}
                                            onChange={(val) => updateDetailsField("timeZone", val)}
                                        />
                                        <ValidatedInput 
                                            label="HEADQUARTERS"
                                            value={detailsForm.headquarters}
                                            onChange={(e) => updateDetailsField("headquarters", e.target.value)}
                                            placeholder="City, Region"
                                        />
                                        <ValidatedInput 
                                            label="OPERATING_REGIONS"
                                            value={detailsForm.operatingRegions}
                                            onChange={(e) => updateDetailsField("operatingRegions", e.target.value)}
                                            placeholder="NA, EMEA, APAC"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">DESCRIPTION</label>
                                        <textarea 
                                            value={detailsForm.description}
                                            onChange={(e) => updateDetailsField("description", e.target.value)}
                                            className="cyber-input w-full h-24 resize-none uppercase"
                                            placeholder="Sector summary and operational scope..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">MISSION_BRIEF</label>
                                        <textarea 
                                            value={detailsForm.mission}
                                            onChange={(e) => updateDetailsField("mission", e.target.value)}
                                            className="cyber-input w-full h-28 resize-none uppercase"
                                            placeholder="Mission statement and long-term objective..."
                                        />
                                    </div>
                                </>
                            )}

                            {detailsStep === 1 && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <FileUpload 
                                            label="BRAND_LOGO"
                                            value={detailsForm.logo}
                                            onChange={(e: any) => handleFileSelect("logo", e, 512, 512)}
                                            previewHeight="h-40"
                                            previewWidth="w-40"
                                        />
                                        <div className="space-y-4 pt-4">
                                            <ValidatedInput 
                                                label="BRAND_PALETTE"
                                                value={detailsForm.brandPalette}
                                                onChange={(e) => updateDetailsField("brandPalette", e.target.value)}
                                                placeholder="#00F2FF, #111827, #FFFFFF"
                                            />
                                            <ValidatedInput 
                                                label="BRAND_VOICE"
                                                value={detailsForm.brandVoice}
                                                onChange={(e) => updateDetailsField("brandVoice", e.target.value)}
                                                placeholder="COMMANDING / PRECISE / FUTURIST"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <FileUpload 
                                            label="BRAND_BANNER"
                                            value={detailsForm.banner}
                                            onChange={(e: any) => handleFileSelect("banner", e, 1920, 600)}
                                            previewHeight="h-48"
                                        />
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[9px] text-white/40 leading-relaxed uppercase">
                                            Banners should be high-resolution landscape images (1920x600 recommended). Logos work best as square vector or PNG files with transparency.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {detailsStep === 2 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <CustomSelect 
                                            label="OPERATING_MODEL"
                                            value={detailsForm.operatingModel}
                                            options={[
                                              { label: "Centralized Command", value: "centralized" },
                                              { label: "Federated Cells", value: "federated" },
                                              { label: "Hybrid Operations", value: "hybrid" },
                                              { label: "Autonomous Pods", value: "autonomous" }
                                            ]}
                                            onChange={(val) => updateDetailsField("operatingModel", val)}
                                        />
                                        <CustomSelect 
                                            label="SERVICE_TIER"
                                            value={detailsForm.serviceTier}
                                            options={[
                                              { label: "Mission Critical", value: "mission-critical" },
                                              { label: "High Availability", value: "high-availability" },
                                              { label: "Standard", value: "standard" },
                                              { label: "Experimental", value: "experimental" }
                                            ]}
                                            onChange={(val) => updateDetailsField("serviceTier", val)}
                                        />
                                        <ValidatedInput 
                                            label="PRODUCT_FOCUS"
                                            value={detailsForm.productFocus}
                                            onChange={(e) => updateDetailsField("productFocus", e.target.value)}
                                            placeholder="Primary products or services"
                                        />
                                        <ValidatedInput 
                                            label="CUSTOMER_SEGMENTS"
                                            value={detailsForm.customerSegments}
                                            onChange={(e) => updateDetailsField("customerSegments", e.target.value)}
                                            placeholder="Enterprise, Gov, B2B, B2C"
                                        />
                                        <ValidatedInput 
                                            label="SUPPORT_WINDOW"
                                            value={detailsForm.supportWindow}
                                            onChange={(e) => updateDetailsField("supportWindow", e.target.value)}
                                            placeholder="24/7, Weekdays, Follow-the-sun"
                                        />
                                        <ValidatedInput 
                                            label="UPTIME_TARGET"
                                            value={detailsForm.uptimeTarget}
                                            onChange={(e) => updateDetailsField("uptimeTarget", e.target.value)}
                                            placeholder="99.9%, 99.99%"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">CRITICAL_WORKFLOWS</label>
                                        <textarea 
                                            value={detailsForm.criticalWorkflows}
                                            onChange={(e) => updateDetailsField("criticalWorkflows", e.target.value)}
                                            className="cyber-input w-full h-28 resize-none uppercase"
                                            placeholder="Top workflows or pipelines that must never fail..."
                                        />
                                    </div>
                                </>
                            )}

                            {detailsStep === 3 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <CustomSelect 
                                            label="SECURITY_TIER"
                                            value={detailsForm.securityTier}
                                            options={[
                                              { label: "Restricted", value: "restricted" },
                                              { label: "Confidential", value: "confidential" },
                                              { label: "Controlled", value: "controlled" },
                                              { label: "Public", value: "public" }
                                            ]}
                                            onChange={(val) => updateDetailsField("securityTier", val)}
                                        />
                                        {/* ... existing fields ... */}
                                        <div className="col-span-2 space-y-4 border-t border-white/5 pt-4">
                                            <div className="text-[10px] font-black text-white/30 tracking-widest uppercase">ORG_CHAT_PROTOCOLS</div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <ToggleCard 
                                                    label="ALLOW_DIRECT_MESSAGES"
                                                    active={detailsForm.chatPolicy?.allowDirectMessages ?? defaultOrgChatPolicy.allowDirectMessages}
                                                    disabled={
                                                        (globalPolicy && !globalPolicy.allowDirectMessages) || 
                                                        (systemOrgOverride && !systemOrgOverride.allowDirectMessages)
                                                    }
                                                    onToggle={() => setDetailsForm((prev: any) => ({
                                                        ...prev,
                                                        chatPolicy: { ...prev.chatPolicy, allowDirectMessages: !(prev.chatPolicy?.allowDirectMessages ?? defaultOrgChatPolicy.allowDirectMessages) }
                                                    }))}
                                                />
                                                <ToggleCard 
                                                    label="ALLOW_GROUP_CHATS"
                                                    active={detailsForm.chatPolicy?.allowGroupChats ?? defaultOrgChatPolicy.allowGroupChats}
                                                    disabled={
                                                        (globalPolicy && !globalPolicy.allowGroupChats) || 
                                                        (systemOrgOverride && !systemOrgOverride.allowGroupChats)
                                                    }
                                                    onToggle={() => setDetailsForm((prev: any) => ({
                                                        ...prev,
                                                        chatPolicy: { ...prev.chatPolicy, allowGroupChats: !(prev.chatPolicy?.allowGroupChats ?? defaultOrgChatPolicy.allowGroupChats) }
                                                    }))}
                                                />
                                                <ToggleCard 
                                                    label="ALLOW_FILE_UPLOADS"
                                                    active={detailsForm.chatPolicy?.allowFileUploads ?? defaultOrgChatPolicy.allowFileUploads}
                                                    disabled={
                                                        (globalPolicy && !globalPolicy.allowFileUploads) || 
                                                        (systemOrgOverride && !systemOrgOverride.allowFileUploads)
                                                    }
                                                    onToggle={() => setDetailsForm((prev: any) => ({
                                                        ...prev,
                                                        chatPolicy: { ...prev.chatPolicy, allowFileUploads: !(prev.chatPolicy?.allowFileUploads ?? defaultOrgChatPolicy.allowFileUploads) }
                                                    }))}
                                                />
                                                <ToggleCard 
                                                    label="ALLOW_DELETE_THREADS"
                                                    active={detailsForm.chatPolicy?.allowDeleteThreads ?? defaultOrgChatPolicy.allowDeleteThreads}
                                                    disabled={
                                                        (globalPolicy && !globalPolicy.allowDeleteThreads) || 
                                                        (systemOrgOverride && !systemOrgOverride.allowDeleteThreads)
                                                    }
                                                    onToggle={() => setDetailsForm((prev: any) => ({
                                                        ...prev,
                                                        chatPolicy: { ...prev.chatPolicy, allowDeleteThreads: !(prev.chatPolicy?.allowDeleteThreads ?? defaultOrgChatPolicy.allowDeleteThreads) }
                                                    }))}
                                                />
                                                <ToggleCard 
                                                    label="ALLOW_LEAVE_THREADS"
                                                    active={detailsForm.chatPolicy?.allowLeaveThreads ?? defaultOrgChatPolicy.allowLeaveThreads}
                                                    disabled={
                                                        (globalPolicy && !globalPolicy.allowLeaveThreads) || 
                                                        (systemOrgOverride && !systemOrgOverride.allowLeaveThreads)
                                                    }
                                                    onToggle={() => setDetailsForm((prev: any) => ({
                                                        ...prev,
                                                        chatPolicy: { ...prev.chatPolicy, allowLeaveThreads: !(prev.chatPolicy?.allowLeaveThreads ?? defaultOrgChatPolicy.allowLeaveThreads) }
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                        
                                        <CustomSelect 
                                            label="DATA_CLASSIFICATION"
                                            value={detailsForm.dataClassification}
                                            options={[
                                              { label: "PII / PHI", value: "pii-phi" },
                                              { label: "Financial", value: "financial" },
                                              { label: "Operational", value: "operational" },
                                              { label: "Research", value: "research" }
                                            ]}
                                            onChange={(val) => updateDetailsField("dataClassification", val)}
                                        />
                                        <ValidatedInput 
                                            label="COMPLIANCE_REGIMES"
                                            value={detailsForm.compliance}
                                            onChange={(e) => updateDetailsField("compliance", e.target.value)}
                                            placeholder="SOC2, HIPAA, ISO27001"
                                        />
                                        <ValidatedInput 
                                            label="DATA_RESIDENCY"
                                            value={detailsForm.dataResidency}
                                            onChange={(e) => updateDetailsField("dataResidency", e.target.value)}
                                            placeholder="US-East, EU-West"
                                        />
                                        <ValidatedInput 
                                            label="RISK_PROFILE"
                                            value={detailsForm.riskProfile}
                                            onChange={(e) => updateDetailsField("riskProfile", e.target.value)}
                                            placeholder="Low / Medium / High"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">INCIDENT_ESCALATION</label>
                                        <textarea 
                                            value={detailsForm.incidentEscalation}
                                            onChange={(e) => updateDetailsField("incidentEscalation", e.target.value)}
                                            className="cyber-input w-full h-28 resize-none uppercase"
                                            placeholder="Escalation path, on-call rotation, war room details..."
                                        />
                                    </div>
                                </>
                            )}

                            {detailsStep === 4 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <CustomSelect 
                                            label="DEPLOYMENT_MODEL"
                                            value={detailsForm.deploymentModel}
                                            options={[
                                              { label: "Cloud Hosted", value: "cloud" },
                                              { label: "Hybrid", value: "hybrid" },
                                              { label: "On-Prem", value: "on-prem" },
                                              { label: "Air-Gapped", value: "air-gapped" }
                                            ]}
                                            onChange={(val) => updateDetailsField("deploymentModel", val)}
                                        />
                                        <ValidatedInput 
                                            label="IDENTITY_PROVIDER"
                                            value={detailsForm.identityProvider}
                                            onChange={(e) => updateDetailsField("identityProvider", e.target.value)}
                                            placeholder="Okta, Azure AD, Ping"
                                        />
                                        <ValidatedInput 
                                            label="INTEGRATION_STACK"
                                            value={detailsForm.integrationStack}
                                            onChange={(e) => updateDetailsField("integrationStack", e.target.value)}
                                            placeholder="Webhook, Kafka, REST"
                                        />
                                        <ValidatedInput 
                                            label="DATA_WAREHOUSE"
                                            value={detailsForm.dataWarehouse}
                                            onChange={(e) => updateDetailsField("dataWarehouse", e.target.value)}
                                            placeholder="Snowflake, BigQuery"
                                        />
                                        <ValidatedInput 
                                            label="ERP_CRM"
                                            value={detailsForm.erpCrm}
                                            onChange={(e) => updateDetailsField("erpCrm", e.target.value)}
                                            placeholder="SAP, Salesforce"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">AI_USE_CASES</label>
                                        <textarea 
                                            value={detailsForm.aiUseCases}
                                            onChange={(e) => updateDetailsField("aiUseCases", e.target.value)}
                                            className="cyber-input w-full h-28 resize-none uppercase"
                                            placeholder="Automation, predictive models, copilots..."
                                        />
                                    </div>
                                </>
                            )}

                            {detailsStep === 5 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ValidatedInput 
                                            label="POINT_OF_CONTACT"
                                            value={detailsForm.pointOfContactName}
                                            onChange={(e) => updateDetailsField("pointOfContactName", e.target.value)}
                                            placeholder="Primary contact name"
                                        />
                                        <ValidatedInput 
                                            label="POC_EMAIL"
                                            value={detailsForm.pointOfContactEmail}
                                            onChange={(e) => updateDetailsField("pointOfContactEmail", e.target.value)}
                                            placeholder="contact@domain.com"
                                        />
                                        <ValidatedInput 
                                            label="POC_PHONE"
                                            value={detailsForm.pointOfContactPhone}
                                            onChange={(e) => updateDetailsField("pointOfContactPhone", e.target.value)}
                                            placeholder="+1 (000) 000-0000"
                                        />
                                        <ValidatedInput 
                                            label="BILLING_CONTACT"
                                            value={detailsForm.billingContact}
                                            onChange={(e) => updateDetailsField("billingContact", e.target.value)}
                                            placeholder="billing@domain.com"
                                        />
                                        <ValidatedInput 
                                            label="LEGAL_CONTACT"
                                            value={detailsForm.legalContact}
                                            onChange={(e) => updateDetailsField("legalContact", e.target.value)}
                                            placeholder="legal@domain.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">NOTES</label>
                                        <textarea 
                                            value={detailsForm.notes}
                                            onChange={(e) => updateDetailsField("notes", e.target.value)}
                                            className="cyber-input w-full h-28 resize-none uppercase"
                                            placeholder="Special instructions, escalation notes, contractual details..."
                                        />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button 
                    onClick={() => setDetailsStep(prev => Math.max(0, prev - 1))}
                    disabled={detailsStep === 0}
                    className={cn(
                        "px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all",
                        detailsStep === 0 
                            ? "bg-white/5 text-white/20 border border-white/5" 
                            : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                    )}
                >
                    PREVIOUS_STEP
                </button>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={handleSaveDetails}
                        className="px-6 py-3 rounded-2xl bg-primary text-black text-[10px] font-black tracking-[0.3em] uppercase hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {isDetailsSaving ? "SAVING_PROFILE" : "COMMIT_PROFILE"}
                    </button>
                    <button 
                        onClick={() => setDetailsStep(prev => Math.min(onboardingSteps.length - 1, prev + 1))}
                        disabled={detailsStep >= onboardingSteps.length - 1}
                        className={cn(
                            "px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all",
                            detailsStep >= onboardingSteps.length - 1 
                                ? "bg-white/5 text-white/20 border border-white/5" 
                                : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                        )}
                    >
                        NEXT_STEP
                    </button>
                </div>
            </div>
            {confirmModal}
        </div>
    );
  }

  if (manageOrgId) {
    const org = orgs.find(o => o.id === manageOrgId);
    const primaryLink = links.find(l => l.isPrimary) || null;
    const secondaryLinks = links.filter(l => !l.isPrimary);
    const allowOverrides = overrides.filter((ovr) => ovr.value).length;
    const denyOverrides = overrides.length - allowOverrides;
    return (
        <div className="space-y-10 font-mono">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase">{org?.name}</h1>
                        <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Sector Administrative Interface</p>
                    </div>
                </div>
                <button 
                    onClick={() => setManageOrgId(null)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-black tracking-[0.2em] hover:text-white transition-all"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    BACK_TO_SQUADRONS
                </button>
            </div>

            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <button onClick={() => setActiveSubTab("links")} className={cn("px-4 py-2 text-[10px] font-black tracking-widest transition-all", activeSubTab === "links" ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white")}>INVITATION_LINKS</button>
                <button onClick={() => setActiveSubTab("requests")} className={cn("px-4 py-2 text-[10px] font-black tracking-widest transition-all relative", activeSubTab === "requests" ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white")}>
                    UPLINK_REQUESTS
                    {requests.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />}
                </button>
                <button onClick={() => setActiveSubTab("members")} className={cn("px-4 py-2 text-[10px] font-black tracking-widest transition-all", activeSubTab === "members" ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white")}>ACTIVE_MEMBERS</button>
                <button onClick={() => setActiveSubTab("overrides")} className={cn("px-4 py-2 text-[10px] font-black tracking-widest transition-all", activeSubTab === "overrides" ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white")}>SECTOR_OVERRIDES</button>
            </div>

            <AnimatePresence mode="wait">
                {activeSubTab === "links" && (
                    <motion.div key="links" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <div className="glass-panel p-6 rounded-[28px] border-white/5 space-y-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-60 pointer-events-none" />
                            <div className="relative z-10 flex items-start justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black tracking-widest uppercase text-white">PRIMARY_INVITE_LINK</div>
                                        <div className="text-[9px] text-white/30 uppercase font-bold mt-1">Auto-generated access relay for org onboarding</div>
                                    </div>
                                </div>
                                {primaryLink ? (
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleReissueLink(primaryLink.id)}
                                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white/60 hover:text-white transition-all"
                                        >
                                            REISSUE_LINK
                                        </button>
                                        <button 
                                            onClick={() => handleToggleLinkStatus(primaryLink.id, primaryLink.active)}
                                            className={cn("px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all", primaryLink.active ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20")}
                                        >
                                            {primaryLink.active ? "ACTIVE" : "OFFLINE"}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleCreatePrimaryLink}
                                        className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-[9px] font-black uppercase hover:bg-primary/20 transition-all"
                                    >
                                        FORGE_PRIMARY_LINK
                                    </button>
                                )}
                            </div>

                            {primaryLink ? (
                                <>
                                    <div className="relative z-10 p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group">
                                        <code className="text-[10px] text-primary/60 font-mono truncate mr-4">{resolvedBaseUrl}/join/{primaryLink.code}</code>
                                        <button onClick={() => {
                                            navigator.clipboard.writeText(`${resolvedBaseUrl}/join/${primaryLink.code}`);
                                        }} className="p-2 hover:text-primary transition-colors"><ExternalLink size={14} /></button>
                                    </div>
                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-[9px] font-bold uppercase text-white/30">
                                        <button
                                            onClick={() => handleToggleLinkApproval(primaryLink.id, primaryLink.requiresApproval)}
                                            className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border transition-all justify-center", primaryLink.requiresApproval ? "border-primary/40 text-primary bg-primary/10" : "border-green-500/30 text-green-500 bg-green-500/10")}
                                        >
                                            <ShieldCheck size={12} /> {primaryLink.requiresApproval ? "APPROVAL_REQ" : "AUTO_JOIN"}
                                        </button>
                                        <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/5">
                                            <Clock size={12} /> {primaryLink.useCount} USES
                                        </div>
                                        <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/5">
                                            <Mail size={12} /> {org?.pointOfContactEmail || "NO_POC_EMAIL"}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="relative z-10 py-10 text-center text-[9px] font-black tracking-[0.3em] uppercase text-white/20">
                                    Primary link missing. Forge one to route onboarding to your point of contact.
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-6">
                            <div className="glass-panel p-6 rounded-[28px] border-white/5 space-y-5 h-fit">
                                <div className="text-[10px] font-black tracking-[0.4em] uppercase text-white/30">LINK_FORGE</div>
                                <ValidatedInput 
                                    label="LINK_LABEL"
                                    value={linkConfig.label}
                                    onChange={(e) => setLinkConfig(prev => ({ ...prev, label: e.target.value }))}
                                    placeholder="Secondary invite label"
                                />
                                <CustomSelect 
                                    label="JOIN_MODE"
                                    value={linkConfig.requiresApproval ? "approval" : "auto"}
                                    options={[
                                      { label: "Approval Required", value: "approval" },
                                      { label: "Auto Join", value: "auto" }
                                    ]}
                                    onChange={(val) => setLinkConfig(prev => ({ ...prev, requiresApproval: val === "approval" }))}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-70" />
                                        <div className="relative z-10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-white/40 tracking-widest uppercase">MAX_USES</label>
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                                                    <Activity className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                            <input 
                                                type="number"
                                                value={linkConfig.maxUses}
                                                onChange={(e) => setLinkConfig(prev => ({ ...prev, maxUses: e.target.value }))}
                                                className="w-full bg-transparent text-lg font-black tracking-tight text-white outline-none"
                                                placeholder="UNLIMITED"
                                            />
                                            <div className="text-[8px] font-black uppercase text-white/30 tracking-[0.3em]">CAP_USAGE_COUNT</div>
                                        </div>
                                    </div>
                                    <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent opacity-70" />
                                        <div className="relative z-10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-white/40 tracking-widest uppercase">EXPIRES_AT</label>
                                                <div className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
                                                    <Clock className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                            <input 
                                                type="datetime-local"
                                                value={linkConfig.expiresAt}
                                                onChange={(e) => setLinkConfig(prev => ({ ...prev, expiresAt: e.target.value }))}
                                                className="w-full bg-transparent text-sm font-bold text-white outline-none uppercase"
                                            />
                                            <div className="text-[8px] font-black uppercase text-white/30 tracking-[0.3em]">TIME_LOCK</div>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleCreateLink}
                                    className="w-full py-4 rounded-2xl bg-primary text-black text-[10px] font-black tracking-[0.3em] uppercase hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    CREATE_LINK
                                </button>
                                <div className="text-[9px] text-white/30 uppercase font-bold leading-relaxed">
                                    Forge secondary access points for partners, pilots, or controlled rollouts.
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">SECONDARY_LINKS</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {secondaryLinks.length === 0 ? (
                                        <div className="py-16 text-center opacity-30 text-[10px] font-black tracking-[0.4em] uppercase">No secondary links forged.</div>
                                    ) : (
                                        <AnimatePresence>
                                            {secondaryLinks.map(link => (
                                                <motion.div
                                                    key={link.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="glass-panel p-6 rounded-[24px] border-white/5 space-y-4 relative group/card"
                                                >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <LinkIcon className="w-4 h-4 text-primary" />
                                                        <span className="text-xs font-bold text-white uppercase">{link.label || "SECURE_LINK"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleToggleLinkStatus(link.id, link.active)}
                                                            className={cn("px-2 py-0.5 rounded-md text-[8px] font-black uppercase transition-all", link.active ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20")}
                                                        >
                                                            {link.active ? "ACTIVE" : "OFFLINE"}
                                                        </button>
                                                        <button onClick={() => handleDeleteLink(link.id)} className="p-1.5 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group">
                                                    <code className="text-[10px] text-primary/60 font-mono truncate mr-4">{resolvedBaseUrl}/join/{link.code}</code>
                                                    <button onClick={() => {
                                                        navigator.clipboard.writeText(`${resolvedBaseUrl}/join/${link.code}`);
                                                    }} className="p-2 hover:text-primary transition-colors"><ExternalLink size={14} /></button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => handleToggleLinkApproval(link.id, link.requiresApproval)}
                                                        className={cn("flex items-center gap-2 text-[8px] font-black uppercase justify-center px-2 py-1 rounded-md border transition-all", link.requiresApproval ? "bg-primary/10 text-primary border-primary/30" : "bg-green-500/10 text-green-500 border-green-500/30")}
                                                    >
                                                        <ShieldCheck size={12} /> {link.requiresApproval ? "APPROVAL_REQ" : "AUTO_JOIN"}
                                                    </button>
                                                    <div className="flex items-center gap-2 text-white/30 text-[9px] font-bold justify-center">
                                                        <Clock size={12} /> {link.useCount} USES
                                                    </div>
                                                </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeSubTab === "requests" && (
                    <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="py-20 text-center opacity-20 text-[10px] font-black tracking-[0.4em] uppercase">No pending uplink requests detected.</div>
                        ) : (
                            <AnimatePresence>
                            {requests.map(req => (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="glass-panel p-6 rounded-[24px] border-white/5 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                            {req.user.image ? <img src={req.user.image} className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-white/20" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white uppercase">{req.user.name || "UNIDENTIFIED_AGENT"}</div>
                                            <div className="text-[10px] text-white/30 font-mono">{req.user.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleActionRequest(req.id, "APPROVE")} className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-[10px] font-black hover:bg-green-500/20 transition-all flex items-center gap-2">
                                            <Check size={14} /> AUTHORIZE
                                        </button>
                                        <button onClick={() => handleActionRequest(req.id, "REJECT")} className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black hover:bg-red-500/20 transition-all flex items-center gap-2">
                                            <UserX size={14} /> REJECT
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                            </AnimatePresence>
                        )}
                    </motion.div>
                )}

                {activeSubTab === "members" && (
                    <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence>
                            {members.map(member => (
                                <motion.div
                                    key={member.userId}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="glass-panel p-6 rounded-[24px] border-white/5 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                            {member.user.image ? <img src={member.user.image} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-white/20" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white uppercase">{member.user.name || "ACTIVE_OPERATIVE"}</div>
                                            <div className="text-[9px] text-primary font-mono uppercase">{member.role?.name || "MEMBER"}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleKickMember(member.userId)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-500 transition-all" title="Terminate Access">
                                        <UserX size={18} />
                                    </button>
                                </motion.div>
                            ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {activeSubTab === "overrides" && (
                    <motion.div key="overrides" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                            <div className="glass-panel p-6 rounded-[28px] border-white/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-70" />
                                <div className="relative z-10 flex flex-col gap-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black tracking-[0.4em] uppercase text-red-400/80">SECTOR_OVERRIDE_MATRIX</div>
                                            <p className="text-[9px] text-red-300/70 uppercase font-black tracking-widest mt-2 leading-relaxed">
                                                Overrides supersede role inheritance for every operative in the sector.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">TOTAL</div>
                                            <div className="text-2xl font-black text-white mt-2">{overrides.length}</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-green-500/70">ALLOW</div>
                                            <div className="text-2xl font-black text-green-500 mt-2">{allowOverrides}</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500/70">DENY</div>
                                            <div className="text-2xl font-black text-red-500 mt-2">{denyOverrides}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel p-6 rounded-[28px] border-white/5 space-y-5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-70" />
                                <div className="relative z-10 space-y-4">
                                    <div className="text-[10px] font-black tracking-[0.4em] uppercase text-white/40">DEPLOY_OVERRIDE</div>
                                    <CustomSelect 
                                        label="PERMISSION_SIGNAL"
                                        placeholder="SELECT_OVERRIDE_VECTOR..."
                                        value={overrideSelectValue}
                                        options={availablePermissions.map(p => ({ label: p.name.toUpperCase(), value: p.name }))}
                                        onChange={async (val) => {
                                          setOverrideSelectValue(val);
                                          const ok = await handleToggleOrgOverride(val, false);
                                          if (ok) {
                                            setTimeout(() => setOverrideSelectValue(""), 500);
                                          }
                                        }}
                                    />
                                    <div className="text-[9px] text-white/30 uppercase font-bold leading-relaxed">
                                        Selecting a permission instantly deploys a sector-level override. Toggle later to switch allow/deny.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence>
                                {overrides.map(ovr => (
                                    <motion.div
                                        key={ovr.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-primary/20 transition-all"
                                    >
                                        <div>
                                            <div className="text-xs font-black text-white uppercase tracking-widest">{ovr.permission.name}</div>
                                            <div className="text-[8px] text-white/30 uppercase mt-1 font-bold">Global override active</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "px-3 py-1 rounded-md text-[8px] font-black uppercase",
                                                ovr.value ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                            )}>
                                                {ovr.value ? "FORCE_ALLOW" : "FORCE_DENY"}
                                            </div>
                                            <button 
                                                onClick={() => handleToggleOrgOverride(ovr.permission.name, ovr.value)}
                                                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-primary transition-all"
                                            >
                                                <Settings2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {overrides.length === 0 && (
                                <div className="py-20 text-center opacity-20 text-[10px] font-black tracking-[0.4em] uppercase">No global overrides configured for this sector.</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {confirmModal}
        </div>
    );
  }

  return (
    <div className="space-y-10 font-mono pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">SECTOR_MANAGEMENT</h1>
          <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mt-2">Oversee organizational entities and tenant nodes</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-black text-xs font-black tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
        >
          <Plus className="w-4 h-4" />
          ESTABLISH_SECTOR
        </button>
      </div>

      <div className="relative group max-w-md">
        <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-colors">
          <div className="pl-4 text-white/30"><Search className="w-4 h-4" /></div>
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SCAN_SECTOR_IDENTIFIER..."
            className="w-full bg-transparent p-4 text-xs font-mono text-primary placeholder:text-white/20 outline-none uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredOrgs.map((org) => (
            <motion.div
              layout
              key={org.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-6 rounded-[32px] border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-primary transition-colors overflow-hidden">
                  {org.logo ? (
                    <img src={org.logo} alt={`${org.name} logo`} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openManage(org.id)}
                    className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-primary transition-all"
                    title="Administrative Access"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openDetails(org)}
                    className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-primary transition-all"
                    title="Org Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openModal(org)}
                    className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(org.id)}
                    className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-black tracking-tighter text-white uppercase relative z-10">{org.name}</h3>
              <p className="text-[10px] font-mono text-primary mt-1 relative z-10">/{org.slug}</p>
              
              <div className="mt-6 space-y-4 relative z-10">
                <div className="flex items-center justify-between text-[10px] font-bold text-white/40 tracking-widest uppercase">
                  <span>OPERATIVES_LINKED</span>
                  <span className="text-white font-mono">{org._count?.members || 0}</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/40 w-1/3" />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-2 text-white/20">
                  <Globe className="w-3 h-3" />
                  <span className="text-[8px] font-black tracking-widest uppercase">NODE_ACTIVE</span>
                </div>
                <button 
                    onClick={() => openViz(org)}
                    className="flex items-center gap-2 text-[9px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest"
                >
                  VISUALIZE <Network className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Org Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-panel rounded-[40px] border-white/10 p-10 z-[120] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tighter uppercase text-white">
                    {editingOrg ? "SECTOR_RECONFIGURATION" : "ESTABLISH_NEW_SECTOR"}
                </h2>
                <button onClick={closeModal} className="p-3 hover:bg-white/5 rounded-2xl transition-all"><X className="w-6 h-6 text-white/40" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <ValidatedInput 
                    required
                    label="ENTITY_NAME"
                    icon={<Building2 className="w-3 h-3" />}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    validate={validateName}
                    placeholder="e.g. CYBERDYNE_SYSTEMS" 
                />
                <ValidatedInput 
                    required
                    label="SLUG_IDENTIFIER"
                    icon={<Globe className="w-3 h-3" />}
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    validate={validateSlug}
                    placeholder="cyberdyne-sys" 
                />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">DESCRIPTION</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="cyber-input w-full h-24 resize-none uppercase" 
                    placeholder="Sector purpose and objectives..." 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput 
                      label="POINT_OF_CONTACT"
                      icon={<User className="w-3 h-3" />}
                      value={formData.pointOfContactName}
                      onChange={(e) => setFormData({...formData, pointOfContactName: e.target.value})}
                      placeholder="Primary contact name"
                  />
                  <ValidatedInput 
                      label="POC_EMAIL"
                      icon={<Mail className="w-3 h-3" />}
                      value={formData.pointOfContactEmail}
                      onChange={(e) => setFormData({...formData, pointOfContactEmail: e.target.value})}
                      placeholder="contact@domain.com"
                  />
                  <ValidatedInput 
                      label="POC_PHONE"
                      icon={<Phone className="w-3 h-3" />}
                      value={formData.pointOfContactPhone}
                      onChange={(e) => setFormData({...formData, pointOfContactPhone: e.target.value})}
                      placeholder="+1 (000) 000-0000"
                  />
                </div>

                {!editingOrg && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ValidatedInput 
                        label="PRIMARY_LINK_LABEL"
                        icon={<LinkIcon className="w-3 h-3" />}
                        value={formData.primaryInviteLabel}
                        onChange={(e) => setFormData({...formData, primaryInviteLabel: e.target.value})}
                        placeholder="Primary Invite"
                    />
                    <CustomSelect 
                        label="JOIN_MODE"
                        value={formData.primaryInviteRequiresApproval ? "approval" : "auto"}
                        options={[
                          { label: "Approval Required", value: "approval" },
                          { label: "Auto Join", value: "auto" }
                        ]}
                        onChange={(val) => setFormData({...formData, primaryInviteRequiresApproval: val === "approval" })}
                    />
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-primary text-black font-black rounded-2xl text-[10px] tracking-[0.3em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(0,242,255,0.3)]"
                  >
                    {editingOrg ? "COMMIT_CHANGES" : "INITIALIZE_SECTOR"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {confirmModal}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">{title}</div>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      {children}
    </div>
  );
}

function ActionButton({ onClick, icon, label, active, danger }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all duration-300 group",
        active 
            ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_20px_rgba(0,242,255,0.1)]" 
            : danger 
                ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40 text-red-500/60 hover:text-red-500" 
                : "bg-white/5 border-white/5 hover:border-white/20 text-white/40 hover:text-white"
      )}
    >
      <div className="group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <span className="text-[9px] font-black tracking-[0.2em] uppercase">{label}</span>
    </button>
  );
}

function InfoRow({ icon, label, value, color = "text-white" }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className="text-white/20 p-2 rounded-lg bg-white/5">{React.cloneElement(icon, { size: 14 })}</div>
        <span className="text-[9px] font-black tracking-[0.2em] text-white/30 uppercase">{label}</span>
      </div>
      <span className={cn("text-xs font-mono font-bold", color)}>{value}</span>
    </div>
  );
}

function ToggleCard({
  label,
  active,
  onToggle,
  disabled
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "p-4 rounded-2xl border text-left transition-all",
        active
          ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_20px_rgba(0,242,255,0.12)]"
          : "bg-white/5 border-white/10 text-white/40 hover:border-white/20",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="text-[9px] font-black tracking-[0.25em] uppercase">{label}</div>
      <div className="mt-2 text-[8px] font-bold uppercase tracking-widest">
        {active ? "ENABLED" : "RESTRICTED"}
      </div>
    </button>
  );
}
