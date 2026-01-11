"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Lock,
  ChevronRight,
  ShieldAlert,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleManagementProps {
  initialRoles: any[];
  availablePermissions: any[];
}

export function RoleManagement({ initialRoles, availablePermissions }: RoleManagementProps) {
  const [activeTab, setActiveTab] = useState<"roles" | "permissions">("roles");
  const [roles, setRoles] = useState(initialRoles);
  const [perms, setPerms] = useState(availablePermissions);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissionIds: [] as string[],
  });

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<any | null>(null);
  const [permFormData, setPermFormData] = useState({
    name: "",
    description: "",
  });

  const openModal = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || "",
        permissionIds: role.permissions.map((p: any) => p.id),
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        description: "",
        permissionIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const openPermModal = (perm?: any) => {
    if (perm) {
      setEditingPerm(perm);
      setPermFormData({ name: perm.name, description: perm.description || "" });
    } else {
      setEditingPerm(null);
      setPermFormData({ name: "", description: "" });
    }
    setIsPermModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const closePermModal = () => {
    setIsPermModalOpen(false);
    setEditingPerm(null);
  };

  const togglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter(pid => pid !== id)
        : [...prev.permissionIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingRole ? "PATCH" : "POST";
    const url = editingRole ? `/api/admin/roles/${editingRole.id}` : "/api/admin/roles";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        if (editingRole) {
          setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
        } else {
          setRoles(prev => [...prev, updated]);
        }
        closeModal();
      }
    } catch (err) {
      console.error("Failed to save role");
    }
  };

  const handlePermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingPerm ? "PATCH" : "POST";
    const url = editingPerm ? `/api/admin/permissions/${editingPerm.id}` : "/api/admin/permissions";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permFormData),
      });
      if (res.ok) {
        const updated = await res.json();
        if (editingPerm) {
          setPerms(prev => prev.map(p => p.id === updated.id ? updated : p));
        } else {
          setPerms(prev => [...prev, updated]);
        }
        closePermModal();
      }
    } catch (err) {
      console.error("Failed to save permission");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("DELETE_ROLE? Operatives assigned to this role may lose access.")) return;
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRoles(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete role");
    }
  };

  const handlePermDelete = async (id: string) => {
    if (!confirm("DELETE_PERMISSION? This will remove it from all roles and individual overrides.")) return;
    try {
      const res = await fetch(`/api/admin/permissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPerms(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete permission");
    }
  };

  return (
    <div className="space-y-10 font-mono">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">PROTOCOL_AUTHORIZATION_MATRIX</h1>
          <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mt-2">Manage RBAC Hierarchy & Permission Bank</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => activeTab === 'roles' ? openModal() : openPermModal()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-black text-xs font-black tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            >
                <Plus className="w-4 h-4" />
                {activeTab === 'roles' ? 'GENERATE_ROLE' : 'GENERATE_PERMISSION'}
            </button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
        <button 
            onClick={() => setActiveTab("roles")}
            className={cn(
                "px-4 py-2 text-[10px] font-black tracking-widest transition-all",
                activeTab === "roles" ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white"
            )}
        >
            ROLES_REGISTRY
        </button>
        <button 
            onClick={() => setActiveTab("permissions")}
            className={cn(
                "px-4 py-2 text-[10px] font-black tracking-widest transition-all",
                activeTab === "permissions" ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white"
            )}
        >
            PERMISSION_BANK
        </button>
      </div>

      <div className="pb-20">
        <AnimatePresence mode="wait">
          {activeTab === "roles" ? (
            <motion.div
              key="roles"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {roles.map((role) => (
                <motion.div
                  layout
                  key={role.id}
                  className="group glass-panel p-8 rounded-[32px] border-white/5 hover:border-primary/20 transition-all relative overflow-hidden"
                >
                  {role.isSystem && (
                    <div className="absolute top-0 right-0 p-4">
                      <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-black tracking-widest text-white/30 uppercase">SYSTEM_ROLE</div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border",
                        role.isSystem ? "bg-white/5 border-white/10 text-white/40" : "bg-primary/10 border-primary/20 text-primary"
                      )}>
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tighter text-white uppercase">{role.name}</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase mt-1">{role.description || "NO_DESCRIPTION_LOGGED"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((p: any) => (
                        <span key={p.id} className="px-2 py-1 rounded-md bg-black/40 border border-white/5 text-[9px] font-bold text-white/60 tracking-wider">
                          {p.name.toUpperCase()}
                        </span>
                      ))}
                      {role.permissions.length === 0 && (
                        <span className="text-[10px] text-white/20 italic">ZERO_PERMISSIONS_GRIP</span>
                      )}
                    </div>

                    <div className="h-px w-full bg-white/5 my-6" />

                    <div className="flex items-center justify-between">
                      <div className="text-[9px] font-black text-white/20 tracking-widest uppercase">
                        ACTIVE_PERMS: {role.permissions.length}
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => openModal(role)}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!role.isSystem && (
                          <button 
                            onClick={() => handleDelete(role.id)}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/30 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="perms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {perms.map((perm) => (
                <motion.div
                  layout
                  key={perm.id}
                  className="glass-panel p-6 rounded-2xl border-white/5 hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-black text-primary tracking-widest uppercase truncate pr-4">{perm.name}</div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => openPermModal(perm)} className="p-1.5 hover:text-primary transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handlePermDelete(perm.id)} className="p-1.5 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40 font-medium leading-relaxed">{perm.description || "NO_DESCRIPTION"}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Role Edit Modal */}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass-panel rounded-[40px] border-white/10 p-10 z-[120] overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter">{editingRole ? "PROTOCOL_OVERRIDE" : "NEW_PERMISSION_NODE"}</h2>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Configure security hierarchy</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-3 hover:bg-white/5 rounded-2xl transition-all"><X className="w-6 h-6 text-white/40" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">ROLE_DESIGNATION</label>
                    <input 
                      disabled={editingRole?.isSystem}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="cyber-input w-full" 
                      placeholder="e.g. TACTICAL_ADVISOR" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">SYNOPSIS</label>
                    <input 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="cyber-input w-full" 
                      placeholder="Short description of duties..." 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-primary" />
                    <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">PERMISSION_MATRIX</label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {perms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePermission(p.id)}
                        className={cn(
                          "p-3 rounded-xl border text-[10px] font-bold tracking-tighter text-left transition-all relative group",
                          formData.permissionIds.includes(p.id) 
                            ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_15px_rgba(0,242,255,0.1)]" 
                            : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="uppercase truncate pr-4">{p.name.split(':').join('_')}</span>
                          {formData.permissionIds.includes(p.id) && <ShieldCheck className="w-3 h-3 flex-shrink-0" />}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/90 rounded-xl transition-opacity p-2 text-[8px] text-white/80 text-center">
                          {p.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-primary text-black font-black rounded-2xl text-[10px] tracking-[0.3em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(0,242,255,0.3)]"
                  >
                    {editingRole ? "COMMIT_OVERRIDE" : "INITIALIZE_ROLE_PROTOCOL"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Permission Edit Modal */}
      <AnimatePresence>
        {isPermModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePermModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-panel rounded-[40px] border-white/10 p-10 z-[120] shadow-2xl"
            >
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-8">{editingPerm ? "EDIT_PERM_NODE" : "NEW_PERM_NODE"}</h2>
              <form onSubmit={handlePermSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">PERM_IDENTIFIER</label>
                  <input 
                    required
                    value={permFormData.name}
                    onChange={(e) => setPermFormData({...permFormData, name: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                    className="cyber-input w-full font-mono text-primary" 
                    placeholder="domain:action" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 tracking-widest uppercase">DESCRIPTION</label>
                  <textarea 
                    value={permFormData.description}
                    onChange={(e) => setPermFormData({...permFormData, description: e.target.value})}
                    className="cyber-input w-full h-24 resize-none" 
                    placeholder="Define the scope of this permission..." 
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-primary text-black font-black rounded-2xl text-[10px] tracking-[0.3em] uppercase hover:scale-[1.02] transition-all">
                    {editingPerm ? "UPDATE_NODE" : "CREATE_NODE"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
