export const defaultOrgChatPolicy = {
  allowDirectMessages: true,
  allowGroupChats: true,
  allowFileUploads: true,
  allowDeleteThreads: true,
  allowLeaveThreads: true,
  messageRetentionDays: 90,
  maxGroupSize: 50,
  allowedExternalDomains: [] as string[],
};

export type OrgChatPolicy = typeof defaultOrgChatPolicy;

export function mergeOrgPolicies(global: OrgChatPolicy, override: Partial<OrgChatPolicy>): OrgChatPolicy {
  return { ...global, ...override };
}
