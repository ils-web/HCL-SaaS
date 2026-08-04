const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test(){
  const tasksDb = await prisma.task.findMany({
    where: { status: { in: ['NEW', 'IN_PROGRESS', 'COMPLETED'] } },
    include: { department: true, system: true, team: true, worker: true }
  });
  console.log('Found tasks:', tasksDb.length);
  
  const tasks = tasksDb.map(t => {
    try {
      const isQr = t.customDefectName?.includes('דיווח מהמחלקה') || t.customDefectName?.includes('תקלה חדשה') || t.inspectorName?.includes('צוות');
      return { defect: t.system?.name || t.customDefectName || 'אחר' };
    } catch (e) {
      console.error('Error mapping task', t.id, e.message);
      return { defect: 'ERROR' };
    }
  });
  
  console.log('Mapped OK');
  const filtered = tasks.filter(t => t.defect && !t.defect.includes('הכל תקין'));
  console.log('Filtered OK');
}

test().catch(console.error).finally(()=>prisma.$disconnect());
