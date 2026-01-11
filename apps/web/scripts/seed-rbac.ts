import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  // User Management
  { name: "users:read", description: "View list of users and details" },
  { name: "users:create", description: "Create new users" },
  { name: "users:update", description: "Update user details" },
  { name: "users:delete", description: "Delete users" },
  { name: "users:ban", description: "Ban or unban users" },
  
  // Role Management
  { name: "roles:read", description: "View roles and permissions" },
  { name: "roles:create", description: "Create new roles" },
  { name: "roles:update", description: "Update roles and permissions" },
  { name: "roles:delete", description: "Delete roles" },

  // Organization Management
  { name: "orgs:read", description: "View organizations" },
  { name: "orgs:create", description: "Create organizations" },
  { name: "orgs:update", description: "Update organization details" },
  { name: "orgs:delete", description: "Delete organizations" },

  // System
  { name: "logs:read", description: "View audit logs" },
  { name: "settings:manage", description: "Manage system settings" },
];

async function main() {
  console.log("Seeding Permissions Bank...");
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
  }

  console.log("Seeding Global Roles...");
  const allPerms = await prisma.permission.findMany();
  
  // Super Admin
  const superAdminRole = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: {
      name: "Super Admin",
      description: "Full system access.",
      isSystem: true,
      permissions: { connect: allPerms.map(p => ({ id: p.id })) }
    }
  });

  // User
  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    update: {},
    create: {
      name: "User",
      description: "Standard operative access.",
      isSystem: true
    }
  });

  console.log("Seeding Default Organization...");
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: "nexus-core" },
    update: {},
    create: {
      name: "Nexus Core",
      slug: "nexus-core",
      description: "Primary system organization."
    }
  });

  console.log("Syncing Admin Operatives...");
  const admins = await prisma.user.findMany({ where: { role: "admin" } });
  for (const admin of admins) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { roleId: superAdminRole.id }
    });
    
    // Add to default org
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: defaultOrg.id, userId: admin.id } },
      update: {},
      create: {
        organizationId: defaultOrg.id,
        userId: admin.id,
        roleId: superAdminRole.id
      }
    });
  }

  console.log("RBAC & Multi-tenant Seed Completed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });