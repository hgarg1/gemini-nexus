const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const key = 'allowed_squad_settings';
    const value = JSON.stringify(['isPublic', 'allowInvites', 'description']);
    await prisma.systemSettings.upsert({
        where: { key },
        update: {},
        create: { key, value },
    });
    console.log('System settings seeded.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
