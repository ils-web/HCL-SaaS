const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany();
  console.log("Teams in DB:");
  teams.forEach(t => console.log(`- "${t.name}" (ID: ${t.id})`));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
