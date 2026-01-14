import { prisma } from "@repo/database";
import { applyOrgPolicy, resolveChatPolicySettings } from "./chat-policy";

export async function getEffectiveChatPolicy(userId?: string | null) {
  const setting = await prisma.systemSettings.findUnique({
    where: { key: "chat_policy" },
  });
  const { policy: globalPolicy, orgOverride } = resolveChatPolicySettings(setting?.value);

  if (!userId) {
    return { policy: globalPolicy, globalPolicy, orgPolicy: null, orgOverride, activeOrgId: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      activeOrgId: true,
      memberships: { select: { organizationId: true } },
    },
  });

  const activeOrgId = user?.activeOrgId && user.memberships.some(m => m.organizationId === user.activeOrgId)
    ? user.activeOrgId
    : null;

  const orgPolicy = activeOrgId
    ? (await prisma.organization.findUnique({
        where: { id: activeOrgId },
        select: { chatPolicy: true },
      }))?.chatPolicy || null
    : null;

  const policy = applyOrgPolicy(globalPolicy, orgPolicy as any, orgOverride);
  return { policy, globalPolicy, orgPolicy, orgOverride, activeOrgId };
}
