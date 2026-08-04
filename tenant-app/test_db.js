const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.tenant.findFirst().then(console.log).catch(console.error).finally(()= 
