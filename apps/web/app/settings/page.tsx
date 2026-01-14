"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ImagePlus, Mail, Phone, Save, User, X, Shield, Key, Building2, Ban, Unlock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { startRegistration } from "@simplewebauthn/browser";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
};

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialRef = useRef<{ name: string; email: string; phone: string; image: string | null }>({
    name: "",
    email: "",
    phone: "",
    image: null,
  });

  const [form, setForm] = useState<ProfileForm>({ name: "", email: "", phone: "" });
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const hydrateFromSession = () => {
      setForm({
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        phone: (session?.user as any)?.phone ?? "",
      });
      setImage(session?.user?.image ?? null);
    };

    hydrateFromSession();

    const loadProfile = async () => {
      try {
        const [res, blockedRes] = await Promise.all([
          fetch("/api/user", { cache: "no-store" }),
          fetch("/api/user/blocked", { cache: "no-store" })
        ]);
        
        const data = await res.json();
        const blockedData = await blockedRes.json();

        if (res.ok && data.user) {
          const next = {
            name: data.user.name ?? "",
            email: data.user.email ?? "",
            phone: data.user.phone ?? "",
          };
          setForm(next);
          setImage(data.user.image ?? null);
          setMemberships(Array.isArray(data.user.memberships) ? data.user.memberships : []);
          initialRef.current = { ...next, image: data.user.image ?? null };
        } else {
          initialRef.current = {
            name: session?.user?.name ?? "",
            email: session?.user?.email ?? "",
            phone: (session?.user as any)?.phone ?? "",
            image: session?.user?.image ?? null,
          };
          setMemberships([]);
          setError(data.error || "Unable to load profile");
        }

        if (blockedRes.ok && blockedData.blockedUsers) {
          setBlockedUsers(blockedData.blockedUsers);
        }
      } catch (err) {
        initialRef.current = {
          name: session?.user?.name ?? "",
          email: session?.user?.email ?? "",
          phone: (session?.user as any)?.phone ?? "",
          image: session?.user?.image ?? null,
        };
        setMemberships([]);
        setBlockedUsers([]);
        setError("Unable to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [status, session, router]);

  const hasChanges = useMemo(() => {
    const initial = initialRef.current;
    return (
      form.name !== initial.name ||
      form.email !== initial.email ||
      form.phone !== initial.phone ||
      image !== initial.image
    );
  }, [form, image]);

  const updateField = (key: keyof ProfileForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          image,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profile update failed");
      }

      const updated = {
        name: data.user?.name ?? "",
        email: data.user?.email ?? "",
        phone: data.user?.phone ?? "",
      };
      const nextImage = data.user?.image ?? null;

      setForm(updated);
      setImage(nextImage);
      initialRef.current = { ...updated, image: nextImage };
      await update?.({
        name: updated.name,
        email: updated.email,
        image: nextImage,
        phone: updated.phone,
      } as any);
      setSuccess("Profile updated");
    } catch (err: any) {
      setError(err.message || "Profile update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPasskey = async () => {
    setIsRegisteringPasskey(true);
    setError(null);
    setSuccess(null);
    try {
      const resp = await fetch("/api/auth/webauthn/register/options");
      const options = await resp.json();
      
      if (options.error) throw new Error(options.error);

      const attResp = await startRegistration(options);

      const verificationResp = await fetch("/api/auth/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attResp),
      });

      const verificationJSON = await verificationResp.json();

      if (verificationJSON && verificationJSON.verified) {
        setSuccess("Passkey registered successfully");
      } else {
        throw new Error("Passkey verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register passkey");
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleUnblock = async (targetId: string) => {
    try {
      const res = await fetch("/api/user/blocked", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.id !== targetId));
        setSuccess("User unblocked");
      } else {
        setError("Failed to unblock user");
      }
    } catch (err) {
      setError("Failed to unblock user");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 animate-pulse mb-4">
          <User className="text-primary w-8 h-8" />
        </div>
        <div className="text-[10px] font-black tracking-[0.3em] text-primary/50 animate-pulse">SYNCING_PROFILE...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="scanline animate-scanline" />
      </div>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="glass-panel rounded-[32px] border-white/10 p-8 md:p-12">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <div className="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase">USER_SETTINGS</div>
              <h1 className="text-3xl font-black tracking-tighter">PROFILE_CONTROL_CENTER</h1>
              <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mt-2">Update identity, uplink, and visuals.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/10 text-xs font-black tracking-[0.2em] text-white/70 hover:text-white hover:border-primary/40 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              RETURN_TO_STREAM
            </button>
          </header>

          <form onSubmit={handleSave} className="grid lg:grid-cols-[320px_1fr] gap-10">
            <div className="glass-panel rounded-[28px] border-white/10 p-6 h-fit">
              <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">PROFILE_IMAGE</div>
              <div className="mt-6 flex flex-col items-center gap-5">
                <div className="w-36 h-36 rounded-[28px] bg-gradient-to-br from-primary to-secondary p-[1px]">
                  <div className="w-full h-full rounded-[28px] bg-background flex items-center justify-center overflow-hidden">
                    {image ? (
                      <img src={image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-white/60" />
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black text-[10px] font-black tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
                  >
                    <ImagePlus className="w-4 h-4" />
                    UPLOAD
                  </button>
                  {image && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-[10px] font-black tracking-[0.2em] text-white/60 hover:text-white transition-all"
                    >
                      <X className="w-4 h-4" />
                      REMOVE
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-white/40 text-center uppercase tracking-[0.2em]">
                  Recommended: square image, 1MB or less.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase">USERNAME</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={form.name}
                      onChange={updateField("name")}
                      className="cyber-input w-full pl-11 text-sm font-semibold"
                      placeholder="ENTER_USERNAME"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase">EMAIL</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={updateField("email")}
                      className="cyber-input w-full pl-11 text-sm font-semibold"
                      placeholder="ENTER_EMAIL"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase">PHONE_NUMBER</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    value={form.phone}
                    onChange={updateField("phone")}
                    className="cyber-input w-full pl-11 text-sm font-semibold"
                    placeholder="ENTER_PHONE"
                  />
                </div>
              </div>

              {/* Passkey Section */}
              <div className="glass-panel rounded-[24px] border-white/10 p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-secondary" />
                      <div className="text-[10px] font-black tracking-[0.3em] text-secondary/60 uppercase">SECURITY_UPLINK</div>
                    </div>
                    <div className="text-sm font-bold mt-2">Passkeys & Biometrics</div>
                    <p className="text-white/40 text-xs mt-1">
                      Authenticate with FaceID, TouchID, or hardware keys.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPasskey}
                    disabled={isRegisteringPasskey}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 hover:border-secondary/40 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Key className="w-4 h-4" />
                    <span className="text-[10px] font-black tracking-[0.2em]">
                      {isRegisteringPasskey ? "REGISTERING..." : "ADD_PASSKEY"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Memberships Section */}
              <div className="glass-panel rounded-[24px] border-white/10 p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase">ORG_MEMBERSHIPS</div>
                    <div className="text-sm font-bold mt-2">Active Sector Access</div>
                    <p className="text-white/40 text-xs mt-1">
                      Only approved or auto-joined sectors appear here.
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] text-white/60">
                    {memberships.length} LINKED
                  </div>
                </div>

                {memberships.length === 0 ? (
                  <div className="py-10 text-center text-[10px] font-black tracking-[0.4em] uppercase text-white/20">
                    NO_ACTIVE_SECTORS
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {memberships.map((membership) => (
                      <div key={membership.organization.id} className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/5">
                        {membership.organization.banner && (
                          <div className="absolute inset-0 opacity-30">
                            <img src={membership.organization.banner} alt={`${membership.organization.name} banner`} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="relative z-10 p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                            {membership.organization.logo ? (
                              <img src={membership.organization.logo} alt={`${membership.organization.name} logo`} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-5 h-5 text-white/40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black uppercase truncate">{membership.organization.name}</div>
                            <div className="text-[9px] text-primary font-mono uppercase">/{membership.organization.slug}</div>
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-[0.3em] text-primary">
                              {membership.role?.name || "MEMBER"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blocked Users Section */}
              <div className="glass-panel rounded-[24px] border-white/10 p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black tracking-[0.3em] text-red-500/60 uppercase">BLOCKED_OPERATIVES</div>
                    <div className="text-sm font-bold mt-2">Restricted Access List</div>
                    <p className="text-white/40 text-xs mt-1">
                      Users blocked from contacting you.
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] text-white/60">
                    {blockedUsers.length} BLOCKED
                  </div>
                </div>

                {blockedUsers.length === 0 ? (
                  <div className="py-10 text-center text-[10px] font-black tracking-[0.4em] uppercase text-white/20">
                    NO_BLOCKS_ACTIVE
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-[20px] bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                            {user.image ? (
                              <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-white/40" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold uppercase">{user.name || "UNKNOWN"}</div>
                            <div className="text-[9px] text-white/30 font-mono">{user.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblock(user.id)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                          title="Revoke Block"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-panel rounded-[24px] border-white/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase">SAVE_CHANGES</div>
                  <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mt-2">
                    Confirm your identity updates before pushing live.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!hasChanges || isSaving}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black tracking-[0.2em] transition-all",
                    !hasChanges || isSaving
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-primary text-black hover:scale-105 active:scale-95"
                  )}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "SAVING" : "COMMIT"}
                </button>
              </div>

              <AnimatePresence>
                {(error || success) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "rounded-2xl border p-4 text-xs font-bold tracking-[0.2em] uppercase",
                      error
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-primary/40 bg-primary/10 text-primary"
                    )}
                  >
                    {error || success}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
