import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SUPERADMIN_PASSWORD = "super123"; // TODO: Move to env variable later

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check for Superadmin login
    if (email === 'superadmin' && password === SUPERADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        role: 'SUPERADMIN',
        token: SUPERADMIN_PASSWORD // Using password as token for MVP
      });
    }

    // Check for Client/Tenant login
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Success! Return user details
    return NextResponse.json({
      success: true,
      role: user.role,
      tenantId: user.tenantId,
      token: user.id // Using user ID as a simple token for MVP
    });

  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
