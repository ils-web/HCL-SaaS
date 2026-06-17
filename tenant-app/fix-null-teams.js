const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'c50b014c-376c-46ba-b811-0f3207365632'; // from url
  
  let defTeam = await prisma.team.findFirst({ where: { tenantId, name: 'ליקויים' } });
  if (!defTeam) {
    defTeam = await prisma.team.create({ data: { tenantId, name: 'ליקויים' } });
  }

  const result = await prisma.task.updateMany({
    where: { teamId: null },
    data: { teamId: defTeam.id }
  });
  
  console.log(`Updated ${result.count} tasks with null teamId to ${defTeam.name}`);
}

main().finally(() => prisma.$disconnect());
