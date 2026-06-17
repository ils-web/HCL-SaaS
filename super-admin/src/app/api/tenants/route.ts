import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tenants);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, status } = await request.json();
    const newTenant = await prisma.tenant.create({
      data: { 
        name,
        status: status || 'ACTIVE'
      }
    });
    return NextResponse.json(newTenant);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: { status }
    });
    return NextResponse.json(updatedTenant);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}
