"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Shield, 
  User, 
  MoreVertical, 
  Trash2, 
  Ban, 
  CheckCircle,
  XCircle,
  Cpu,
  Activity,
  History,
  Mail,
  Key,
  Plus,
  ShieldAlert,
  X,
  Lock,
  ShieldCheck,
  Zap,
  Network,
  ChevronRight,
  Info,
  KeyRound,
  Building2,
  Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ValidatedInput } from "../ui/validated-input";
import { CustomSelect } from "../ui/custom-select";
import { buildPasswordRequirements, defaultPasswordPolicy, validatePasswordWithPolicy } from "@/lib/password-policy";

interface UserManagementProps {
  initialUsers: any[];
  availableRoles: any[];
}

export function UserManagement({ initialUsers, availableRoles }: UserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const [effectivePerms, setEffectivePerms] = useState<any[]>([]);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isPermLoading, setIsPermModalLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: availableRoles.find(r => r.name === "User")?.id || "",
  });
  const [passwordPolicy, setPasswordPolicy] = useState(defaultPasswordPolicy);
  const router = useRouter();

  const roleOptions = useMemo(() => 
    availableRoles.map(r => ({ label: r.name.toUpperCase(), value: r.id })),
    [availableRoles]
  );
  const passwordRequirements = useMemo(
    () => buildPasswordRequirements(passwordPolicy, createFormData.password),
    [passwordPolicy, createFormData.password]
  );

  const validateEmail = (val: string) => {
    if (!val) return "Identification required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Invalid encryption endpoint (email)";
    return null;
  };

  const validateName = (val: string) => {
    if (!val) return "Designation required";
    if (val.length < 2) return "Designation too brief";
    return null;
  };

  const validatePassword = (val: string) => validatePasswordWithPolicy(val, passwordPolicy);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const res = await fetch("/api/password-policy");
        const data = await res.json();
        if (res.ok && data.policy) {
          setPasswordPolicy(data.policy);
        }
      } catch (err) {
        console.error("Failed to load password policy");
      }
    };
    loadPolicy();
  }, []);

  const fetchEffectivePerms = async (userId: string) => {
    setIsPermModalLoading(true);
    setIsPermModalOpen(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/effective-permissions`);
      const data = await res.json();
      if (data.permissions) setEffectivePerms(data.permissions);
    } catch (err) {
      console.error("Failed to fetch effective permissions");
    } finally {
      setIsPermModalLoading(false);
    }
  };

  const handleToggleOverride = async (userId: string, permissionName: string, currentValue: boolean) => {
    const newValue = !currentValue;
    try {
        const res = await fetch(`/api/admin/users/${userId}/overrides`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permissionName, value: newValue }),
        });
        if (res.ok) {
            await fetchEffectivePerms(userId);
        }
    } catch (err) {
        console.error("Failed to toggle override");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(createFormData.email) || validateName(createFormData.name) || validatePassword(createFormData.password)) return;

    try {
      const adminRes = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createFormData),
      });
      if (adminRes.ok) {
          const newUser = await adminRes.json();
          setUsers(prev => [newUser, ...prev]);
          setIsCreateModalOpen(false);
          setCreateFormData({
              name: "",
              email: "",
              password: "",
              roleId: availableRoles.find(r => r.name === "User")?.id || "",
          });
      }
    } catch (err) {
      console.error("Failed to create operative");
    }
  };

  const handleUpdateUser = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated, role: availableRoles.find(r => r.id === (updated.roleId || u.roleId))?.name || u.role } : u));
        if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, ...updated, role: availableRoles.find(r => r.id === (updated.roleId || selectedUser.roleId))?.name || selectedUser.role });
      }
    } catch (err) {
      console.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("PERMANENTLY ERASE OPERATIVE? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        if (selectedUser?.id === id) setSelectedUser(null);
      }
    } catch (err) {
      console.error("Failed to delete user");
    }
  };

  return (
    <div className="relative h-full flex flex-col font-mono">
      {/* Header / Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">OPERATIVES_DB</h1>
          <div className="flex items-center gap-2 mt-2 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
            <span>Active Nodes: {users.filter(u => !u.isBanned).length}</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Total Units: {users.length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="relative w-full md:w-72 group">
            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-colors">
                <div className="pl-4 text-white/30"><Search className="w-4 h-4" /></div>
                <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SEARCH_IDENTITY..."
                className="w-full bg-transparent p-4 text-xs font-mono text-primary placeholder:text-white/20 outline-none uppercase"
                />
            </div>
            </div>
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-primary text-black text-xs font-black tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            >
                <Plus className="w-4 h-4" />
                GENERATE_OPERATIVE
            </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
        <motion.div 
          layout 
          className="grid grid-cols-1 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user) => (
              <motion.div
                layout
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedUser(user)}
                className={cn(
                  "group relative p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] overflow-hidden",
                  selectedUser?.id === user.id 
                    ? "bg-primary/5 border-primary/30 shadow-[0_0_30px_rgba(0,242,255,0.15)]" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border transition-all duration-500",
                        user.isBanned ? "border-red-500/50 grayscale" : "border-white/10"
                      )}>
                        {user.image ? (
                          <img src={user.image} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-white/20" />
                        )}
                      </div>
                      {user.isBanned && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-lg">BANNED</div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white tracking-tight uppercase">{user.name || "Unknown Operative"}</span>
                        {user.role === "Super Admin" ? (
                          <ShieldAlert className="w-3 h-3 text-red-500" />
                        ) : user.role === "Admin" ? (
                          <Shield className="w-3 h-3 text-primary" />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-mono text-white/40">{user.email}</span>
                        <span className="text-[8px] font-black tracking-widest text-white/20 uppercase border border-white/10 px-1.5 rounded bg-white/5">
                          {user.role || "USER"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden md:block text-[10px] font-bold text-white/10 group-hover:text-primary transition-colors uppercase tracking-[0.3em]">
                      VIEW_DETAILS <span className="text-primary animate-pulse">&gt;&gt;</span>
                    </div>
                  </div>
                </div>
                <div className={cn(
                    "absolute top-0 right-0 w-1 h-full transition-all duration-500 opacity-0 group-hover:opacity-100",
                    user.role === "Super Admin" ? "bg-red-500" : "bg-primary"
                )} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Detail Slide-Over */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-[540px] bg-black/90 border-l border-white/10 p-10 z-[120] shadow-[-50px_0_100px_rgba(0,0,0,0.7)] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-start justify-between mb-12">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary to-secondary p-[1px]">
                        <div className="w-full h-full rounded-[28px] bg-black flex items-center justify-center overflow-hidden border border-white/5">
                            {selectedUser.image ? (
                            <img src={selectedUser.image} className="w-full h-full object-cover" />
                            ) : (
                            <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-white/20" /></div>
                            )}
                        </div>
                    </div>
                    {selectedUser.isBanned && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-black text-[9px] font-black px-2 py-1 rounded-lg shadow-xl">SUSPENDED</div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase text-white">{selectedUser.name}</h2>
                    <div className="text-[10px] font-mono text-primary/60 mt-1 uppercase tracking-widest">{selectedUser.id}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>

              <div className="space-y-10">
                <Section title="ACCESS_PRIVILEGES">
                  <div className="space-y-6">
                    <CustomSelect 
                        label="SYSTEM_ROLE_DESIGNATION"
                        value={selectedUser.roleId || ""}
                        options={roleOptions}
                        onChange={(roleId) => handleUpdateUser(selectedUser.id, { roleId })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <ActionButton 
                        onClick={() => handleUpdateUser(selectedUser.id, { isBanned: !selectedUser.isBanned })}
                        icon={<Ban className={selectedUser.isBanned ? "text-red-500" : "text-white/40"} />}
                        label={selectedUser.isBanned ? "RESTORE_ACCESS" : "INITIATE_SUSPENSION"}
                        danger={!selectedUser.isBanned}
                        />
                        <ActionButton 
                        onClick={() => fetchEffectivePerms(selectedUser.id)}
                        icon={<Network className="text-primary" />}
                        label="MAP_PERMISSIONS"
                        />
                        <ActionButton 
                        onClick={async () => {
                            try {
                                await fetch(`/api/admin/users/${selectedUser.id}/blocking`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ canBlockOthers: !selectedUser.canBlockOthers }),
                                });
                                setUsers((prev: any[]) => prev.map(u => u.id === selectedUser.id ? { ...u, canBlockOthers: !u.canBlockOthers } : u));
                                setSelectedUser((prev: any) => prev ? { ...prev, canBlockOthers: !prev.canBlockOthers } : null);
                            } catch (e) { console.error(e); }
                        }}
                        icon={<ShieldCheck className={selectedUser.canBlockOthers ? "text-green-500" : "text-white/40"} />}
                        label={selectedUser.canBlockOthers ? "BLOCKING_ENABLED" : "BLOCKING_DISABLED"}
                        />
                        <ActionButton 
                        onClick={async () => {
                            try {
                                await fetch(`/api/admin/users/${selectedUser.id}/blocking`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ canViewBlockLogs: !selectedUser.canViewBlockLogs }),
                                });
                                setUsers((prev: any[]) => prev.map(u => u.id === selectedUser.id ? { ...u, canViewBlockLogs: !u.canViewBlockLogs } : u));
                                setSelectedUser((prev: any) => prev ? { ...prev, canViewBlockLogs: !prev.canViewBlockLogs } : null);
                            } catch (e) { console.error(e); }
                        }}
                        icon={<Eye className={selectedUser.canViewBlockLogs ? "text-green-500" : "text-white/40"} />}
                        label={selectedUser.canViewBlockLogs ? "LOGS_VISIBLE" : "LOGS_HIDDEN"}
                        />
                    </div>
                  </div>
                </Section>

                <Section title="OPERATIVE_LOGS">
                  <div className="space-y-3">
                    <InfoRow icon={<Mail />} label="ENCRYPTION_ID" value={selectedUser.email} />
                    <InfoRow icon={<History />} label="ENROLLMENT_DATE" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
                    <InfoRow icon={<Activity />} label="UPLINK_STATUS" value={selectedUser.isBanned ? "TERMINATED" : "CONNECTED"} color={selectedUser.isBanned ? "text-red-500" : "text-green-500"} />
                    <InfoRow icon={<Building2 />} label="ORG_LINKS" value={selectedUser.organizations?.join(", ") || "NEXUS_CORE"} />
                    <InfoRow icon={<Key />} label="PASSKEY_NODES" value={`${selectedUser.authenticators?.length || 0} SECURE_KEYS`} />
                  </div>
                </Section>

                <Section title="ERASURE_PROTOCOL">
                  <p className="text-[10px] text-white/30 mb-4 italic uppercase tracking-widest">Warning: This action permanently wipes the operative from the system.</p>
                  <button 
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="w-full p-5 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 rounded-2xl flex items-center justify-center gap-3 text-red-500 transition-all group"
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black tracking-[0.3em]">EXECUTE_PERMANENT_ERASURE</span>
                  </button>
                </Section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Effective Permissions Modal */}
      <AnimatePresence mode="wait">
        {isPermModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPermModalOpen(false)}
              className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[130]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl glass-panel rounded-[40px] border-white/10 p-12 z-[140] overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <Zap className="w-5 h-5 fill-primary/20" />
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase">NEURAL_AUTHORIZATION_SCAN</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase text-white">EFFECTIVE_GRANTS</h2>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-2 font-mono">
                        Computed permission set for operative <span className="text-white">{selectedUser?.email}</span>
                    </p>
                </div>
                <button onClick={() => setIsPermModalOpen(false)} className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5"><X className="w-6 h-6 text-white/40" /></button>
              </div>

              {isPermLoading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6 text-primary animate-pulse">
                    <Activity className="w-12 h-12" />
                    <div className="space-y-2 text-center">
                        <div className="text-[10px] font-black tracking-[0.5em] uppercase">ANALYZING_RBAC_MATRIX...</div>
                        <div className="text-[8px] font-mono text-white/20">RESOLVING_INHERITANCE_AND_OVERRIDES</div>
                    </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar pb-6">
                    <div className="grid grid-cols-1 gap-3">
                        {effectivePerms.map((p) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={p.name} 
                                className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all group relative"
                            >
                                <div className="flex flex-col gap-1.5 relative z-10">
                                    <span className="text-xs font-black tracking-[0.15em] text-white uppercase">{p.name.split(':').join('_')}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-white/20" />
                                            SOURCE: {p.source}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase border transition-all duration-500",
                                        p.value ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                    )}>
                                        {p.value ? "AUTHORIZED" : "ACCESS_DENIED"}
                                    </div>
                                    <button 
                                        onClick={() => handleToggleOverride(selectedUser.id, p.name, p.value)}
                                        className={cn(
                                            "p-3 rounded-xl transition-all border group/btn",
                                            p.value === false ? "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20" : "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                                        )}
                                        title={p.value ? "Revoke Permission" : "Grant Override"}
                                    >
                                        <ShieldAlert className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </motion.div>
                        ))}
                    </div>
                </div>
              )}
              
              <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                <Info className="w-5 h-5 text-white/20 flex-shrink-0" />
                <p className="text-[9px] text-white/40 uppercase tracking-widest leading-relaxed">
                    Overrides applied here will take precedence over role-based inheritance. Overrides are logged in the 
                    <span className="text-primary font-bold"> AUDIT_STREAM</span>.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-panel rounded-[40px] border-white/10 p-10 z-[120] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase text-white">ENROLL_OPERATIVE</h2>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Initialize new node in the nexus</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all"><X className="w-6 h-6 text-white/40" /></button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <ValidatedInput 
                    required
                    label="FULL_NAME_IDENTIFIER"
                    icon={<User className="w-3 h-3" />}
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                    validate={validateName}
                    placeholder="ENTER_NAME" 
                />
                <ValidatedInput 
                    required
                    type="email"
                    label="SECURE_EMAIL_ENDPOINT"
                    icon={<Mail className="w-3 h-3" />}
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                    validate={validateEmail}
                    placeholder="operative@nexus.sh" 
                />
                <ValidatedInput 
                    required
                    type="password"
                    label="TEMPORARY_ACCESS_KEY"
                    icon={<KeyRound className="w-3 h-3" />}
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                    validate={validatePassword}
                    placeholder="••••••••" 
                />
                <div className="grid grid-cols-2 gap-2 px-1">
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded flex items-center justify-center border transition-all duration-300",
                        req.valid ? "bg-primary border-primary" : "bg-white/5 border-white/10"
                      )}>
                        {req.valid && <CheckCircle className="w-2 h-2 text-black" />}
                      </div>
                      <span className={cn(
                        "text-[9px] font-black tracking-tight transition-colors duration-300",
                        req.valid ? "text-primary" : "text-white/20"
                      )}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
                <CustomSelect 
                    label="INITIAL_ACCESS_LEVEL"
                    value={createFormData.roleId}
                    options={roleOptions}
                    onChange={(roleId) => setCreateFormData({...createFormData, roleId})}
                />

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-primary text-black font-black rounded-2xl text-[10px] tracking-[0.4em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(0,242,255,0.3)]"
                  >
                    INITIALIZE_OPERATIVE_LINK
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
      <span className="text-[9px] font-black tracking-widest uppercase">{label}</span>
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

