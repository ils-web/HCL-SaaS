import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }
  try {
    const tenants = await prisma.tenant.findMany();
    const results = [];
    
    for (const tenant of tenants) {
      const defaultEmail = `admin@${tenant.id}.com`;
      
      const existingAdmin = await prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          role: 'ADMIN'
        }
      });
  
      if (!existingAdmin) {
        await prisma.user.create({
          data: {
            tenantId: tenant.id,
            name: `Admin for ${tenant.name}`,
            email: defaultEmail,
            password: '123456',
            role: 'ADMIN'
          }
        });
        results.push(`Created default admin for tenant ${tenant.name} with email: ${defaultEmail}`);
      } else {
        results.push(`Tenant ${tenant.name} already has an admin.`);
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error('Seed API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
