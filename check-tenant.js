const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.findUnique({where:{id:'c50b014c-376c-46ba-b811-0f3207365632'}})
.then(console.log)
.catch(console.error)
.finally(()=>prisma.$disconnect());
