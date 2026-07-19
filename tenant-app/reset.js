const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function main() {
  const pw = await hashPassword('123456');
  
  // Find or create a superadmin
  let admin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
  
  if (!admin) {
    console.log("No superadmin found. Creating one...");
    // Need a tenant first? No, superadmin can have no tenant or a default tenant.
    // Let's check user schema.
    const firstTenant = await prisma.tenant.findFirst();
    if (!firstTenant) {
        console.log("No tenants exist! Cannot create user without tenantId if required.");
        return;
    }
    admin = await prisma.user.create({
      data: {
        email: 'superadmin@example.com',
        name: 'SuperAdmin',
        password: pw,
        role: 'SUPERADMIN',
        tenantId: firstTenant.id
      }
    });
    console.log("Created superadmin@example.com with password 123456");
  } else {
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: pw, email: 'superadmin@example.com' }
    });
    console.log(`Updated password for superadmin ${admin.email} to 123456`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
