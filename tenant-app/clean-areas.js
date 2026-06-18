const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const badAreaNames = ["1", "25", "123", "жжжжж"];
  
  const badAreas = await prisma.area.findMany({
    where: { name: { in: badAreaNames } }
  });

  for (const area of badAreas) {
    const systems = await prisma.system.findMany({ where: { areaId: area.id } });
    
    for (const sys of systems) {
      const tasks = await prisma.task.findMany({ where: { systemId: sys.id } });
      
      for (const task of tasks) {
        // Try to find a template system with the same name
        const templateSys = await prisma.system.findFirst({
          where: { tenantId: sys.tenantId, name: sys.name, area: { name: { notIn: badAreaNames } } }
        });
        
        if (templateSys) {
          await prisma.task.update({ where: { id: task.id }, data: { systemId: templateSys.id } });
        } else {
          const newNotes = sys.name + "\n" + (task.notes || "");
          await prisma.task.update({ where: { id: task.id }, data: { systemId: null, notes: newNotes } });
        }
      }
      
      // Delete the bad system
      await prisma.system.delete({ where: { id: sys.id } });
    }
    
    // Delete the bad area
    await prisma.area.delete({ where: { id: area.id } });
    console.log(`Deleted bad area: ${area.name}`);
  }
}

main().finally(() => prisma.$disconnect());
