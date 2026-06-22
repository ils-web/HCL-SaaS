const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'c50b014c-376c-46ba-b811-0f3207365632';
  
  const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!existing) {
    await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Test Hospital',
        status: 'ACTIVE'
      }
    });
    console.log('Created Tenant ID:', tenantId);
  } else {
    console.log('Tenant already exists:', tenantId);
  }
}

main().catch(console.error).finally(()=>prisma.$disconnect());
