import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }

  try {
    const tenant = await prisma.tenant.findFirst();
    if (tenant) {
      return NextResponse.json({ tenantId: tenant.id });
    }
    return NextResponse.json({ error: 'No tenants found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
