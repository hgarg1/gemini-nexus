import { z } from "zod";

export const defaultChatPolicy = {
  allowPublicLinks: true,
  allowCollaborators: true,
  allowFileUploads: true,
  allowModelSelection: true,
  allowCustomApiKey: true,
  allowDirectMessages: true,
  allowGroupChats: true,
  allowFriendRequests: true,
  allowEmailNotifications: false,
  allowDeleteThreads: true,
  allowLeaveThreads: true,
  maxCollaborators: 12,
  maxLinks: 3,
  adminBypass: true,
  adminChatConstraint: "none" as "none" | "admins_only",
};

export const defaultChatOrgOverride = {
  allowPublicLinks: true,
  allowCollaborators: true,
  allowFileUploads: true,
  allowModelSelection: true,
  allowCustomApiKey: true,
  allowDirectMessages: true,
  allowGroupChats: true,
  allowFriendRequests: true,
  allowEmailNotifications: true,
  allowDeleteThreads: true,
  allowLeaveThreads: true,
  maxCollaborators: true,
  maxLinks: true,
};

export type ChatPolicy = typeof defaultChatPolicy;
export type ChatOrgOverride = typeof defaultChatOrgOverride;

const chatPolicySchema = z.object({
  allowPublicLinks: z.boolean(),
  allowCollaborators: z.boolean(),
  allowFileUploads: z.boolean(),
  allowModelSelection: z.boolean(),
  allowCustomApiKey: z.boolean(),
  allowDirectMessages: z.boolean(),
  allowGroupChats: z.boolean(),
  allowFriendRequests: z.boolean(),
  allowEmailNotifications: z.boolean(),
  allowDeleteThreads: z.boolean(),
  allowLeaveThreads: z.boolean(),
  maxCollaborators: z.number().int().min(1).max(100),
  maxLinks: z.number().int().min(1).max(20),
  adminBypass: z.boolean(),
  adminChatConstraint: z.enum(["none", "admins_only"]),
});

const chatOrgOverrideSchema = z.object({
  allowPublicLinks: z.boolean(),
  allowCollaborators: z.boolean(),
  allowFileUploads: z.boolean(),
  allowModelSelection: z.boolean(),
  allowCustomApiKey: z.boolean(),
  allowDirectMessages: z.boolean(),
  allowGroupChats: z.boolean(),
  allowFriendRequests: z.boolean(),
  allowEmailNotifications: z.boolean(),
  allowDeleteThreads: z.boolean(),
  allowLeaveThreads: z.boolean(),
  maxCollaborators: z.boolean(),
  maxLinks: z.boolean(),
});

const chatPolicySettingSchema = z.object({
  policy: chatPolicySchema.partial().optional(),
  orgOverride: chatOrgOverrideSchema.partial().optional(),
});

export function normalizeChatPolicy(input?: Partial<ChatPolicy> | null) {
  const candidate = input || {};
  const result = chatPolicySchema.partial().safeParse(candidate);
  if (!result.success) {
    return { ...defaultChatPolicy };
  }
  return {
    ...defaultChatPolicy,
    ...result.data,
  };
}

export function normalizeOrgOverride(input?: Partial<ChatOrgOverride> | null) {
  const candidate = input || {};
  const result = chatOrgOverrideSchema.partial().safeParse(candidate);
  if (!result.success) {
    return { ...defaultChatOrgOverride };
  }
  return {
    ...defaultChatOrgOverride,
    ...result.data,
  };
}

export function resolveChatPolicySettings(raw?: string | null) {
  if (!raw) {
    return {
      policy: { ...defaultChatPolicy },
      orgOverride: { ...defaultChatOrgOverride },
    };
  }
  try {
    const parsed = JSON.parse(raw);
    const settingResult = chatPolicySettingSchema.safeParse(parsed);
    if (!settingResult.success) {
      return {
        policy: { ...defaultChatPolicy },
        orgOverride: { ...defaultChatOrgOverride },
      };
    }
    return {
      policy: normalizeChatPolicy(settingResult.data.policy),
      orgOverride: normalizeOrgOverride(settingResult.data.orgOverride),
    };
  } catch {
    return {
      policy: { ...defaultChatPolicy },
      orgOverride: { ...defaultChatOrgOverride },
    };
  }
}

export function applyOrgPolicy(
  globalPolicy: ChatPolicy,
  orgPolicy: Partial<ChatPolicy> | null | undefined,
  orgOverride: ChatOrgOverride
) {
  if (!orgPolicy) return globalPolicy;
  const normalizedOrg = normalizeChatPolicy(orgPolicy);
  return {
    ...globalPolicy,
    allowPublicLinks: orgOverride.allowPublicLinks ? globalPolicy.allowPublicLinks && normalizedOrg.allowPublicLinks : globalPolicy.allowPublicLinks,
    allowCollaborators: orgOverride.allowCollaborators ? globalPolicy.allowCollaborators && normalizedOrg.allowCollaborators : globalPolicy.allowCollaborators,
    allowFileUploads: orgOverride.allowFileUploads ? globalPolicy.allowFileUploads && normalizedOrg.allowFileUploads : globalPolicy.allowFileUploads,
    allowModelSelection: orgOverride.allowModelSelection ? globalPolicy.allowModelSelection && normalizedOrg.allowModelSelection : globalPolicy.allowModelSelection,
    allowCustomApiKey: orgOverride.allowCustomApiKey ? globalPolicy.allowCustomApiKey && normalizedOrg.allowCustomApiKey : globalPolicy.allowCustomApiKey,
    allowDirectMessages: orgOverride.allowDirectMessages ? globalPolicy.allowDirectMessages && normalizedOrg.allowDirectMessages : globalPolicy.allowDirectMessages,
    allowGroupChats: orgOverride.allowGroupChats ? globalPolicy.allowGroupChats && normalizedOrg.allowGroupChats : globalPolicy.allowGroupChats,
    allowFriendRequests: orgOverride.allowFriendRequests ? globalPolicy.allowFriendRequests && normalizedOrg.allowFriendRequests : globalPolicy.allowFriendRequests,
    allowEmailNotifications: orgOverride.allowEmailNotifications ? globalPolicy.allowEmailNotifications && normalizedOrg.allowEmailNotifications : globalPolicy.allowEmailNotifications,
    allowDeleteThreads: orgOverride.allowDeleteThreads ? globalPolicy.allowDeleteThreads && normalizedOrg.allowDeleteThreads : globalPolicy.allowDeleteThreads,
    allowLeaveThreads: orgOverride.allowLeaveThreads ? globalPolicy.allowLeaveThreads && normalizedOrg.allowLeaveThreads : globalPolicy.allowLeaveThreads,
    maxCollaborators: orgOverride.maxCollaborators ? Math.min(globalPolicy.maxCollaborators, normalizedOrg.maxCollaborators) : globalPolicy.maxCollaborators,
    maxLinks: orgOverride.maxLinks ? Math.min(globalPolicy.maxLinks, normalizedOrg.maxLinks) : globalPolicy.maxLinks,
    adminChatConstraint: globalPolicy.adminChatConstraint,
  };
}
