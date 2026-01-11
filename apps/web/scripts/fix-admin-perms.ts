import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing Admin Permissions...");
  
  // 1. Get all available permissions
  const allPermissions = await prisma.permission.findMany();
  console.log(`Found ${allPermissions.length} permissions.`);

  // 2. Find the Super Admin role
  const superAdminRole = await prisma.role.findUnique({
    where: { name: "Super Admin" }
  });

  if (superAdminRole) {
    console.log("Syncing all permissions to Super Admin role...");
    await prisma.role.update({
      where: { id: superAdminRole.id },
      data: {
        permissions: {
          set: [], // Clear
          connect: allPermissions.map(p => ({ id: p.id }))
        }
      }
    });
  } else {
    console.error("Super Admin role not found!");
  }

  // 3. Ensure the admin user has the Super Admin role
  const adminEmail = "admin@nexus.sh";
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (adminUser && superAdminRole) {
    console.log(`Assigning Super Admin role to ${adminEmail}...`);
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        role: "admin", // fallback string
        roleId: superAdminRole.id 
      }
    });
  } else {
    console.error(`User ${adminEmail} not found!`);
  }

  console.log("Permissions fix completed.");
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
