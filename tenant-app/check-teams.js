const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teamsDb = await prisma.team.findMany();
  console.log(teamsDb);
}

main().finally(() => prisma.$disconnect());
