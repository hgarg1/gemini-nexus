import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { name: "nexus.access", description: "Can access the Nexus Hub" },
    { name: "nexus.create", description: "Can create custom AI agents" },
    { name: "nexus.analytics", description: "Can view agent performance metrics" },
    { name: "nexus.publish", description: "Can publish agents to the global registry" },
  ];

  console.log("Seeding Nexus permissions...");

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  // Assign to default User role
  const userRole = await prisma.role.findUnique({ where: { name: "user" } });
  if (userRole) {
    // By default, users get access and create, but not publish
    const perms = await prisma.permission.findMany({
        where: { name: { in: ["nexus.access", "nexus.create", "nexus.analytics"] } }
    });
    
    for (const p of perms) {
        // Connect if not already connected (Prisma doesn't have connectIfNotExists for m-n easily without checking)
        // simpler to just connect and ignore error or check first.
        // For script simplicity, we assume safe to run.
        try {
            await prisma.role.update({
                where: { id: userRole.id },
                data: { permissions: { connect: { id: p.id } } }
            });
        } catch (e) {}
    }
  }

  // Assign all to Admin role
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  if (adminRole) {
    const allPerms = await prisma.permission.findMany({
        where: { name: { startsWith: "nexus." } }
    });
    for (const p of allPerms) {
        try {
            await prisma.role.update({
                where: { id: adminRole.id },
                data: { permissions: { connect: { id: p.id } } }
            });
        } catch (e) {}
    }
  }

  console.log("Permissions seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
