const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    include: { team: true, department: true }
  });
  console.log(`Found ${tasks.length} tasks in DB.`);
  if (tasks.length > 0) {
    console.log(tasks[0]);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
