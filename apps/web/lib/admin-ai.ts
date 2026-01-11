import { prisma } from "@repo/database";

export const adminTools = [
  {
    functionDeclarations: [
      {
        name: "get_system_stats",
        description: "Get current system telemetry including user count, chat count, and message fragments.",
      },
      {
        name: "search_operatives",
        description: "Search for users by name or email to get their IDs and status.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Name or email fragment." },
          },
          required: ["query"],
        },
      },
      {
        name: "ban_user",
        description: "Suspend an operative from the system. Requires confirmation.",
        parameters: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The ID of the user to ban." },
            reason: { type: "string", description: "Reason for the suspension." },
          },
          required: ["userId"],
        },
      },
      {
        name: "unban_user",
        description: "Restore an operative's access.",
        parameters: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The ID of the user to unban." },
          },
          required: ["userId"],
        },
      },
      {
        name: "list_organizations",
        description: "Retrieve all organizations/sectors in the nexus.",
      },
      {
        name: "get_roles",
        description: "List all available security roles and their descriptions.",
      },
      {
        name: "get_permissions_bank",
        description: "List all granular permissions available in the system bank.",
      },
      {
        name: "get_user_details",
        description: "Fetch comprehensive details about a specific operative including their roles, memberships, and permissions.",
        parameters: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The ID of the operative." },
          },
          required: ["userId"],
        },
      },
    ],
  },
];

export const adminFunctions = {
  get_system_stats: async () => {
    const [users, chats, messages, orgs] = await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.organization.count(),
    ]);
    return { users, chats, messages, organizations: orgs, status: "NOMINAL" };
  },
  search_operatives: async ({ query }: { query: string }) => {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        isBanned: true, 
        userRole: { select: { name: true } },
        memberships: { select: { organization: { select: { name: true } } } }
      },
      take: 10,
    });
    return { users: users.map(u => ({
        ...u,
        role: u.userRole?.name,
        organizations: u.memberships.map(m => m.organization.name)
    })) };
  },
  get_user_details: async ({ userId }: { userId: string }) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            userRole: { include: { permissions: true } },
            memberships: { include: { organization: true, role: { include: { permissions: true } } } },
            overrides: { include: { permission: true } }
        }
    });
    if (!user) return { error: "Operative not found." };
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.userRole?.name,
        isBanned: user.isBanned,
        permissions: user.userRole?.permissions.map(p => p.name) || [],
        memberships: user.memberships.map(m => ({
            organization: m.organization.name,
            orgRole: m.role?.name,
            orgPermissions: m.role?.permissions.map(p => p.name) || []
        })),
        individualOverrides: user.overrides.map(o => ({
            permission: o.permission.name,
            value: o.value
        }))
    };
  },
  list_organizations: async () => {
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true, _count: { select: { members: true } } }
    });
    return { organizations: orgs };
  },
  get_roles: async () => {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true, _count: { select: { permissions: true } } }
    });
    return { roles };
  },
  get_permissions_bank: async () => {
    const perms = await prisma.permission.findMany({
      select: { id: true, name: true, description: true }
    });
    return { permissions: perms };
  },
  execute_ban: async (userId: string, adminId: string) => {
    if (userId === adminId) throw new Error("Self-suspension prohibited.");
    return await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true },
    });
  },
  execute_unban: async (userId: string) => {
    return await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    });
  },
};