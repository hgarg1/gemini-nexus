import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up invalid bots...");

  // Since name and systemInstruction are required strings in the schema (if they are), 
  // we only check for empty strings or very short strings.
  // If they are optional, we check for null.
  // Based on the error, 'name' seems required. 
  
  const result = await prisma.bot.deleteMany({
    where: {
      OR: [
        { name: { equals: "" } },
        { systemInstruction: { equals: "" } },
      ]
    }
  });

  console.log(`Deleted ${result.count} invalid bots.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });