const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'c50b014c-376c-46ba-b811-0f3207365632'; // From URL

  const tasksDb = await prisma.task.findMany({
    where: { 
      tenantId,
      status: { in: ['NEW', 'IN_PROGRESS'] }
    },
    include: {
      system: true,
      department: true,
      team: true,
      worker: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const tasks = tasksDb.map(t => {
    // Exact logic from route.ts
    const d = t.createdAt;
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    return {
      id: t.id,
      sheet: t.team?.name || 'ליקויים',
      dept: t.department?.name || 'כללי',
      department: t.department?.name || 'כללי',
      room: t.room,
      system: t.system?.name || 'אחר',
      defect: t.system?.name || 'אחר',
      action: t.actionType === 'REPAIR' ? 'Ремонт' : (t.actionType === 'REPLACE' ? 'Замена' : ''),
      notes: t.notes || '',
      comment: t.notes || '',
      photo: t.photoUrl || '',
      afterPhoto: t.afterPhotoUrl || '',
      status: t.status === 'IN_PROGRESS' ? 'בעבודה' : 'פתוח',
      worker: t.worker?.name || '',
      team: t.team?.name || '',
      timestamp: t.createdAt.getTime(),
      dateStr: dateStr
    };
  });

  console.log(JSON.stringify(tasks, null, 2));
}

main().finally(() => prisma.$disconnect());
