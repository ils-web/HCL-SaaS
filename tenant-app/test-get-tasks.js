const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'c50b014c-376c-46ba-b811-0f3207365632';

  const tasksDb = await prisma.task.findMany({
    where: { tenantId, status: { in: ['NEW', 'IN_PROGRESS'] } },
    include: { department: true }
  });

  const depts = new Set();
  tasksDb.forEach(t => depts.add(t.department?.name || 'כללי'));
  
  console.log("Unique departments in DB Tasks:");
  console.log(Array.from(depts));
}

main().finally(() => prisma.$disconnect());
