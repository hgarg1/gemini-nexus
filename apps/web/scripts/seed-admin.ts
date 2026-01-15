import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nexus.sh";
  // Password: admin123
  const hashedPassword = "$2b$12$pVobYMFDVMETcSM7kuwmc.Jznp95nmLX9ytApgVfy772K8HqPk5.C";

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "admin",
    },
    create: {
      email,
      name: "Nexus Administrator",
      password: hashedPassword,
      role: "admin",
      image: "https://github.com/shadcn.png", // Placeholder cool image
    },
  });

  console.log({ user });
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
