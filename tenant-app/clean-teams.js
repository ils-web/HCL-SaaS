const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({ orderBy: { createdAt: 'asc' } });
  const uniqueTeams = {};
  
  for (const t of teams) {
    if (!uniqueTeams[t.name]) {
      uniqueTeams[t.name] = t;
    } else {
      const primaryTeam = uniqueTeams[t.name];
      console.log(`Merging duplicate team "${t.name}" (ID: ${t.id}) into Primary (ID: ${primaryTeam.id})`);
      
      // Update tasks to point to primary team
      await prisma.task.updateMany({
        where: { teamId: t.id },
        data: { teamId: primaryTeam.id }
      });
      
      // Update users to point to primary team
      await prisma.user.updateMany({
        where: { teamId: t.id },
        data: { teamId: primaryTeam.id }
      });
      
      // Update systems to point to primary team
      await prisma.system.updateMany({
        where: { autoAssignTeamId: t.id },
        data: { autoAssignTeamId: primaryTeam.id }
      });
      
      // Delete duplicate
      await prisma.team.delete({ where: { id: t.id } });
      console.log(`Deleted duplicate "${t.name}"`);
    }
  }
  console.log("Cleanup complete!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
