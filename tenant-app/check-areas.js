const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const areas = await prisma.area.findMany();
  console.log("Areas in DB:");
  areas.forEach(a => console.log(`- "${a.name}" (ID: ${a.id})`));
}

main().finally(() => prisma.$disconnect());
