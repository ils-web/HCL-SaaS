const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'c50b014c-376c-46ba-b811-0f3207365632'; // From URL
  const tasksDb = await prisma.task.findMany({
    where: { tenantId, status: { not: 'CLOSED' } },
    include: { worker: true, team: true, department: true }
  });
  
  const tasks = tasksDb.map(t => ({
      id: t.id,
      sheet: t.team?.name || 'כללי',
      dept: t.department?.name || 'כללי',
      room: t.room,
      defect: t.defect,
      comment: t.comment,
      status: t.status,
      photo: t.photoUrl,
      afterPhoto: t.afterPhotoUrl,
      inspector: t.inspectorName,
      worker: t.worker?.name || '',
      team: t.team?.name || '',
      timestamp: t.createdAt.getTime(),
      dateStr: `${String(t.createdAt.getDate()).padStart(2, '0')}/${String(t.createdAt.getMonth() + 1).padStart(2, '0')}/${t.createdAt.getFullYear()} ${String(t.createdAt.getHours()).padStart(2, '0')}:${String(t.createdAt.getMinutes()).padStart(2, '0')}`,
  }));
  
  console.log(JSON.stringify(tasks, null, 2));
}

main().finally(() => prisma.$disconnect());
